-- Seed data for a single tenant account named "Demo Account"
-- Safe scope: only rows with this account_id are deleted/reinserted.

DO $$
DECLARE
  v_account_id UUID;
  v_owner_user_id UUID;
  v_client_acme UUID;
  v_client_neon UUID;
  v_project_album UUID;
  v_project_podcast UUID;
  v_session_1 UUID;
  v_session_2 UUID;
  v_cat_mics UUID;
  v_cat_inst UUID;
  v_loc_studio_a UUID;
  v_loc_live_room UUID;
  v_asset_1 UUID;
  v_asset_2 UUID;
  v_track_1 UUID;
  v_track_2 UUID;
  v_track_3 UUID;
  v_stem_1 UUID;
  v_stem_2 UUID;
  v_stem_3 UUID;
BEGIN
  SELECT id
  INTO v_account_id
  FROM public.accounts
  WHERE lower(name) = lower('Demo Account')
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_account_id IS NULL THEN
    RAISE EXCEPTION 'Account "Demo Account" not found';
  END IF;

  SELECT am.user_id
  INTO v_owner_user_id
  FROM public.account_memberships am
  WHERE am.account_id = v_account_id
    AND am.status = 'active'
  ORDER BY (am.role = 'admin') DESC, am.created_at ASC
  LIMIT 1;

  IF v_owner_user_id IS NULL THEN
    RAISE EXCEPTION 'No active account member found for "Demo Account"';
  END IF;

  -- -------------------------------------------------------------------------
  -- Reset only this account's demo/workflow data
  -- -------------------------------------------------------------------------
  DELETE FROM public.stem_comments WHERE account_id = v_account_id;
  DELETE FROM public.stems WHERE account_id = v_account_id;
  DELETE FROM public.tracks WHERE account_id = v_account_id;
  DELETE FROM public.session_assets WHERE account_id = v_account_id;
  DELETE FROM public.transactions WHERE account_id = v_account_id;
  DELETE FROM public.sessions WHERE account_id = v_account_id;
  DELETE FROM public.projects WHERE account_id = v_account_id;
  DELETE FROM public.clients WHERE account_id = v_account_id;
  DELETE FROM public.assets WHERE account_id = v_account_id;
  DELETE FROM public.categories WHERE account_id = v_account_id;
  DELETE FROM public.locations WHERE account_id = v_account_id;

  -- -------------------------------------------------------------------------
  -- Categories & locations
  -- -------------------------------------------------------------------------
  INSERT INTO public.categories (account_id, name, color)
  VALUES
    (v_account_id, 'Microphones', '#3b82f6'),
    (v_account_id, 'Instruments', '#f59e0b');

  -- Because RETURNING into two vars only captures first row, fetch explicitly:
  SELECT id INTO v_cat_mics
  FROM public.categories
  WHERE account_id = v_account_id AND name = 'Microphones'
  LIMIT 1;

  SELECT id INTO v_cat_inst
  FROM public.categories
  WHERE account_id = v_account_id AND name = 'Instruments'
  LIMIT 1;

  INSERT INTO public.locations (account_id, name, description)
  VALUES
    (v_account_id, 'Studio A', 'Main control room'),
    (v_account_id, 'Live Room', 'Primary live recording room');

  SELECT id INTO v_loc_studio_a
  FROM public.locations
  WHERE account_id = v_account_id AND name = 'Studio A'
  LIMIT 1;

  SELECT id INTO v_loc_live_room
  FROM public.locations
  WHERE account_id = v_account_id AND name = 'Live Room'
  LIMIT 1;

  -- -------------------------------------------------------------------------
  -- Clients
  -- -------------------------------------------------------------------------
  INSERT INTO public.clients (
    account_id, name, company, email, phone, type, default_hourly_rate, notes, created_by
  )
  VALUES
    (
      v_account_id,
      'Ava Brooks',
      'Acme Records',
      'ava@acmerecords.example',
      '+1-555-0101',
      'label',
      95,
      'Pop vocalist project. Prefers evening sessions.',
      v_owner_user_id
    )
  RETURNING id INTO v_client_acme;

  INSERT INTO public.clients (
    account_id, name, company, email, phone, type, default_hourly_rate, notes, created_by
  )
  VALUES
    (
      v_account_id,
      'Milo Chen',
      'Neon Podcast Network',
      'milo@neonpod.example',
      '+1-555-0102',
      'producer',
      70,
      'Weekly podcast recording and edit package.',
      v_owner_user_id
    )
  RETURNING id INTO v_client_neon;

  -- -------------------------------------------------------------------------
  -- Projects
  -- -------------------------------------------------------------------------
  INSERT INTO public.projects (
    account_id, client_id, name, description, status, project_type, rate_model, storage_policy, notes, created_by
  )
  VALUES
    (
      v_account_id,
      v_client_acme,
      'Midnight Echoes EP',
      '4-track pop EP production and vocal comping',
      'active',
      'recording',
      'per_day',
      'retain_90',
      'Priority project for release in 6 weeks',
      v_owner_user_id
    )
  RETURNING id INTO v_project_album;

  INSERT INTO public.projects (
    account_id, client_id, name, description, status, project_type, rate_model, storage_policy, notes, created_by
  )
  VALUES
    (
      v_account_id,
      v_client_neon,
      'Neon Talks Season 2',
      'Podcast season recording and light post',
      'active',
      'podcast',
      'per_day',
      'retain_90',
      'Batch record 3 episodes per session',
      v_owner_user_id
    )
  RETURNING id INTO v_project_podcast;

  -- -------------------------------------------------------------------------
  -- Tracks + stems (placeholder audio paths)
  -- -------------------------------------------------------------------------
  INSERT INTO public.tracks (
    account_id, project_id, name, description, status, track_no, bpm, key, duration, created_by
  )
  VALUES
    (
      v_account_id,
      v_project_album,
      'Midnight Echoes',
      'Lead single with layered vocal harmonies',
      'mixing',
      1,
      128,
      'A minor',
      214,
      v_owner_user_id
    )
  RETURNING id INTO v_track_1;

  INSERT INTO public.tracks (
    account_id, project_id, name, description, status, track_no, bpm, key, duration, created_by
  )
  VALUES
    (
      v_account_id,
      v_project_album,
      'Afterglow',
      'Second single with wider stereo image',
      'editing',
      2,
      122,
      'F major',
      201,
      v_owner_user_id
    )
  RETURNING id INTO v_track_2;

  INSERT INTO public.tracks (
    account_id, project_id, name, description, status, track_no, bpm, key, duration, created_by
  )
  VALUES
    (
      v_account_id,
      v_project_podcast,
      'Episode 12 Edit',
      'Podcast dialogue tidy-up and levelling',
      'mastering',
      1,
      NULL,
      NULL,
      1840,
      v_owner_user_id
    )
  RETURNING id INTO v_track_3;

  INSERT INTO public.stems (
    account_id, track_id, name, file_path, mime_type, type, sort_order, duration, file_size, color, created_by
  )
  VALUES
    (
      v_account_id,
      v_track_1,
      'Lead Vocal',
      'seed/demo-account/midnight-echoes/lead-vocal.wav',
      'audio/wav',
      'vocals',
      1,
      214,
      25430012,
      '#f472b6',
      v_owner_user_id
    )
  RETURNING id INTO v_stem_1;

  INSERT INTO public.stems (
    account_id, track_id, name, file_path, mime_type, type, sort_order, duration, file_size, color, created_by
  )
  VALUES
    (
      v_account_id,
      v_track_1,
      'Bass DI',
      'seed/demo-account/midnight-echoes/bass-di.wav',
      'audio/wav',
      'bass',
      2,
      214,
      18145008,
      '#60a5fa',
      v_owner_user_id
    )
  RETURNING id INTO v_stem_2;

  INSERT INTO public.stems (
    account_id, track_id, name, file_path, mime_type, type, sort_order, duration, file_size, color, created_by
  )
  VALUES
    (
      v_account_id,
      v_track_3,
      'Dialogue Main',
      'seed/demo-account/neon-talks/episode-12-dialogue.wav',
      'audio/wav',
      'other',
      1,
      1840,
      94230044,
      '#34d399',
      v_owner_user_id
    )
  RETURNING id INTO v_stem_3;

  INSERT INTO public.stem_comments (
    account_id, stem_id, user_id, timestamp, content
  )
  VALUES
    (
      v_account_id,
      v_stem_1,
      v_owner_user_id,
      43,
      'Please tighten this phrase and brighten the top end from bar 9.'
    ),
    (
      v_account_id,
      v_stem_2,
      v_owner_user_id,
      58,
      'Great tone. Add a touch more compression for consistency.'
    ),
    (
      v_account_id,
      v_stem_3,
      v_owner_user_id,
      122,
      'Breath edit needed here before final export.'
    );

  -- -------------------------------------------------------------------------
  -- Sessions
  -- -------------------------------------------------------------------------
  INSERT INTO public.sessions (
    account_id, project_id, session_name, client_name, engineer, start_time, end_time, status, notes, created_by
  )
  VALUES
    (
      v_account_id,
      v_project_album,
      'Vocal Overdub Night',
      'Acme Records',
      'Connor',
      NOW() - INTERVAL '2 days',
      NOW() - INTERVAL '2 days' + INTERVAL '4 hours',
      'completed',
      'Comped verse 2 and re-cut chorus doubles',
      v_owner_user_id
    )
  RETURNING id INTO v_session_1;

  INSERT INTO public.sessions (
    account_id, project_id, session_name, client_name, engineer, start_time, end_time, status, notes, created_by
  )
  VALUES
    (
      v_account_id,
      v_project_podcast,
      'Podcast Batch Record',
      'Neon Podcast Network',
      'Connor',
      NOW() + INTERVAL '1 day',
      NOW() + INTERVAL '1 day' + INTERVAL '3 hours',
      'planned',
      'Record episodes 12-14 in one pass',
      v_owner_user_id
    )
  RETURNING id INTO v_session_2;

  -- -------------------------------------------------------------------------
  -- Assets + usage
  -- -------------------------------------------------------------------------
  INSERT INTO public.assets (
    account_id, asset_code, name, category_id, brand, model, serial_number, status,
    home_location_id, current_location_id, purchase_value, replacement_cost, notes, created_by
  )
  VALUES
    (
      v_account_id, 'MIC-90001', 'Vocal Chain Mic', v_cat_mics, 'Neumann', 'U87 Ai', 'NU87-DEMO-001',
      'available', v_loc_studio_a, v_loc_studio_a, 2899, 3200, 'Primary vocal mic for pop sessions', v_owner_user_id
    )
  RETURNING id INTO v_asset_1;

  INSERT INTO public.assets (
    account_id, asset_code, name, category_id, brand, model, serial_number, status,
    home_location_id, current_location_id, purchase_value, replacement_cost, notes, created_by
  )
  VALUES
    (
      v_account_id, 'INS-90001', 'Session Bass', v_cat_inst, 'Fender', 'Jazz Bass', 'FBASS-DEMO-001',
      'checked_out', v_loc_live_room, v_loc_live_room, 1299, 1450, 'House bass for writing sessions', v_owner_user_id
    )
  RETURNING id INTO v_asset_2;

  -- Add 40 additional demo assets for this account.
  INSERT INTO public.assets (
    account_id, asset_code, name, category_id, brand, model, serial_number, status,
    home_location_id, current_location_id, purchase_value, replacement_cost, notes, created_by
  )
  SELECT
    v_account_id,
    'DEMO-' || LPAD(gs::TEXT, 5, '0'),
    CASE
      WHEN gs % 2 = 0 THEN 'Dynamic Mic #' || gs::TEXT
      ELSE 'DI Box #' || gs::TEXT
    END,
    CASE
      WHEN gs % 2 = 0 THEN v_cat_mics
      ELSE v_cat_inst
    END,
    CASE
      WHEN gs % 2 = 0 THEN 'Shure'
      ELSE 'Radial'
    END,
    CASE
      WHEN gs % 2 = 0 THEN 'SM57'
      ELSE 'J48'
    END,
    'DEMO-SN-' || LPAD(gs::TEXT, 5, '0'),
    'available',
    CASE
      WHEN gs % 2 = 0 THEN v_loc_studio_a
      ELSE v_loc_live_room
    END,
    CASE
      WHEN gs % 2 = 0 THEN v_loc_studio_a
      ELSE v_loc_live_room
    END,
    CASE
      WHEN gs % 2 = 0 THEN 99
      ELSE 199
    END,
    CASE
      WHEN gs % 2 = 0 THEN 129
      ELSE 249
    END,
    'Seeded demo inventory asset',
    v_owner_user_id
  FROM generate_series(1, 40) AS gs;

  INSERT INTO public.session_assets (
    account_id, session_id, asset_id, checked_out_at, check_out_condition, notes
  )
  VALUES
    (
      v_account_id,
      v_session_2,
      v_asset_2,
      NOW() - INTERVAL '1 hour',
      'good',
      'Checked out for tomorrow preparation'
    );

  INSERT INTO public.transactions (
    account_id, asset_id, session_id, type, user_id, condition, from_status, to_status, note, metadata
  )
  VALUES
    (
      v_account_id,
      v_asset_2,
      v_session_2,
      'check_out',
      v_owner_user_id,
      'good',
      'available',
      'checked_out',
      'Preparation checkout for podcast batch session',
      jsonb_build_object('seed', true, 'source', 'seed_demo_account.sql')
    );

  RAISE NOTICE 'Seed completed for Demo Account (%).', v_account_id;
END $$;
