/**
 * API Route: Find Replacement Cost
 *
 * Uses AI to search for current replacement cost of an asset
 */

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // Get API key from database
    const supabase = await createClient()
    const { data: setting, error: settingError } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'anthropic_api_key')
      .single()

    if (settingError || !setting?.value) {
      return NextResponse.json(
        { error: 'Anthropic API key not configured. Please add it in Admin Settings.' },
        { status: 400 }
      )
    }

    const anthropic = new Anthropic({
      apiKey: setting.value,
    })

    const { brand, model, name } = await request.json()

    if (!brand && !model && !name) {
      return NextResponse.json(
        { error: 'At least one of brand, model, or name is required' },
        { status: 400 }
      )
    }

    // Build search query
    const searchQuery = [brand, model, name].filter(Boolean).join(' ')

    // Use Claude to search and estimate replacement cost
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Search online for the current market price of this equipment: "${searchQuery}".

Please find the typical retail/market price for this item (new or used in good condition).

Respond ONLY with a JSON object in this exact format:
{
  "estimatedCost": <number>,
  "currency": "USD",
  "confidence": "<high|medium|low>",
  "source": "<brief description of where you found this price>",
  "notes": "<any relevant notes about availability or pricing variations>"
}

If you cannot find a reliable price, set estimatedCost to null and explain why in the notes field.`,
        },
      ],
    })

    // Parse Claude's response
    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''

    // Extract JSON from response (Claude might wrap it in markdown)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json(
        { error: 'Could not parse AI response', rawResponse: responseText },
        { status: 500 }
      )
    }

    const result = JSON.parse(jsonMatch[0])

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error: any) {
    console.error('Replacement cost API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to find replacement cost' },
      { status: 500 }
    )
  }
}
