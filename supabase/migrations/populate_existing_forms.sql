-- Migration: Populate existing forms with their original fields
-- This preserves the existing form structures so they can be edited in the form builder
-- Based on the templates defined in lib/forms/form-templates.ts

DO $$
DECLARE
  welcome_config_id UUID;
  membership_config_id UUID;
BEGIN
  -- Get or create welcome form config
  SELECT id INTO welcome_config_id 
  FROM public.form_configs 
  WHERE form_type = 'welcome' 
    AND (status = 'published' OR status IS NULL)
  ORDER BY version DESC
  LIMIT 1;
  
  IF welcome_config_id IS NULL THEN
    INSERT INTO public.form_configs (form_type, title, description, is_active, version, status, version_name)
    VALUES ('welcome', 'Welcome Form', 'Welcome form for new visitors', true, 1, 'published', 'Initial Version')
    RETURNING id INTO welcome_config_id;
  ELSE
    -- Update existing config to ensure it's published and has version info
    UPDATE public.form_configs
    SET version = COALESCE(version, 1), 
        status = COALESCE(status, 'published'),
        version_name = COALESCE(version_name, 'Initial Version'),
        is_active = true
    WHERE id = welcome_config_id;
  END IF;
  
  -- Get or create membership form config
  SELECT id INTO membership_config_id 
  FROM public.form_configs 
  WHERE form_type = 'membership' 
    AND (status = 'published' OR status IS NULL)
  ORDER BY version DESC
  LIMIT 1;
  
  IF membership_config_id IS NULL THEN
    INSERT INTO public.form_configs (form_type, title, description, is_active, version, status, version_name)
    VALUES ('membership', 'Membership Form', 'Membership registration form', true, 1, 'published', 'Initial Version')
    RETURNING id INTO membership_config_id;
  ELSE
    -- Update existing config to ensure it's published and has version info
    UPDATE public.form_configs
    SET version = COALESCE(version, 1), 
        status = COALESCE(status, 'published'),
        version_name = COALESCE(version_name, 'Initial Version'),
        is_active = true
    WHERE id = membership_config_id;
  END IF;
  
  -- WELCOME FORM FIELDS
  -- Only insert if fields don't already exist (check by form_config_id and field_key)
  INSERT INTO public.form_fields (
    form_config_id, field_key, field_type, label, placeholder, is_required,
    display_order, db_column, transformation_type, transformation_config,
    is_notes_field, notes_format, options, validation_rules
  ) VALUES
    (welcome_config_id, 'first_name', 'text', 'First Name', 'Enter your first name', true, 1, NULL, 'combine', '{"fields": ["first_name", "surname"], "separator": " "}'::jsonb, false, NULL, NULL::jsonb, '{}'::jsonb),
    (welcome_config_id, 'surname', 'text', 'Surname', 'Enter your surname', true, 2, NULL, 'combine', '{"fields": ["first_name", "surname"], "separator": " "}'::jsonb, false, NULL, NULL::jsonb, '{}'::jsonb),
    (welcome_config_id, 'email', 'email', 'Email Address', 'Enter your email', true, 3, 'email', 'direct', '{}'::jsonb, false, NULL, NULL::jsonb, '{}'::jsonb),
    (welcome_config_id, 'phone', 'tel', 'Phone Number', 'Enter your phone number', false, 4, 'phone', 'direct', '{}'::jsonb, false, NULL, NULL::jsonb, '{}'::jsonb),
    (welcome_config_id, 'marital_status', 'select', 'Marital Status', NULL, false, 5, 'marital_status', 'direct', '{}'::jsonb, false, NULL, '[{"label": "Single", "value": "single"}, {"label": "Married", "value": "married"}, {"label": "Divorced", "value": "divorced"}, {"label": "Widowed", "value": "widowed"}]'::jsonb, '{}'::jsonb),
    (welcome_config_id, 'address', 'textarea', 'Address', 'Enter your address', false, 6, 'address', 'direct', '{}'::jsonb, false, NULL, NULL::jsonb, '{}'::jsonb),
    (welcome_config_id, 'joining_us', 'select', 'Are you joining us?', NULL, false, 7, NULL, 'notes', '{}'::jsonb, true, 'Joining us: {value}', '[{"label": "Yes", "value": "Yes"}, {"label": "No", "value": "No"}]'::jsonb, '{}'::jsonb),
    (welcome_config_id, 'can_visit', 'select', 'Can we visit you?', NULL, false, 8, NULL, 'notes', '{}'::jsonb, true, 'Can visit: {value}', '[{"label": "Yes", "value": "Yes"}, {"label": "No", "value": "No"}]'::jsonb, '{}'::jsonb),
    (welcome_config_id, 'whatsapp_group', 'select', 'Join WhatsApp Group?', NULL, false, 9, NULL, 'notes', '{}'::jsonb, true, 'WhatsApp Group: {value}', '[{"label": "Yes", "value": "Yes"}, {"label": "No", "value": "No"}]'::jsonb, '{}'::jsonb)
  ON CONFLICT (form_config_id, field_key) DO NOTHING;

  -- MEMBERSHIP FORM FIELDS
  INSERT INTO public.form_fields (
    form_config_id, field_key, field_type, label, placeholder, is_required,
    display_order, db_column, transformation_type, transformation_config,
    is_notes_field, notes_format, options, validation_rules
  ) VALUES
    (membership_config_id, 'first_name', 'text', 'First Name', 'Enter your first name', true, 1, NULL, 'combine', '{"fields": ["first_name", "surname"], "separator": " "}'::jsonb, false, NULL, NULL::jsonb, '{}'::jsonb),
    (membership_config_id, 'surname', 'text', 'Surname', 'Enter your surname', true, 2, NULL, 'combine', '{"fields": ["first_name", "surname"], "separator": " "}'::jsonb, false, NULL, NULL::jsonb, '{}'::jsonb),
    (membership_config_id, 'email', 'email', 'Email Address', 'Enter your email', true, 3, 'email', 'direct', '{}'::jsonb, false, NULL, NULL::jsonb, '{}'::jsonb),
    (membership_config_id, 'phone', 'tel', 'Phone Number', 'Enter your phone number', false, 4, 'phone', 'direct', '{}'::jsonb, false, NULL, NULL::jsonb, '{}'::jsonb),
    (membership_config_id, 'gender', 'select', 'Gender', NULL, false, 5, 'gender', 'direct', '{}'::jsonb, false, NULL, '[{"label": "Male", "value": "male"}, {"label": "Female", "value": "female"}]'::jsonb, '{}'::jsonb),
    (membership_config_id, 'departments', 'select', 'Department Interests', NULL, false, 6, 'department_interest', 'array', '{}'::jsonb, false, NULL, NULL::jsonb, '{}'::jsonb)
  ON CONFLICT (form_config_id, field_key) DO NOTHING;

END $$;

