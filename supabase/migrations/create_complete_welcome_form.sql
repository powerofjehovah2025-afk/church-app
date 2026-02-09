-- Migration: Create complete Welcome Form based on Google Form
-- This replaces the simple welcome form with the full version from RCCG POJ Essex

DO $$
DECLARE
  welcome_config_id UUID;
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
    VALUES ('welcome', 'Welcome Form', 'RCCG Power of Jehovah, Essex - Welcome Form for New Visitors', true, 1, 'published', 'Complete Welcome Form')
    RETURNING id INTO welcome_config_id;
  ELSE
    -- Update existing config
    UPDATE public.form_configs
    SET version = COALESCE(version, 1), 
        status = 'published',
        version_name = 'Complete Welcome Form',
        title = 'Welcome Form',
        description = 'RCCG Power of Jehovah, Essex - Welcome Form for New Visitors',
        is_active = true
    WHERE id = welcome_config_id;
    
    -- Delete existing fields to replace with new ones
    DELETE FROM public.form_fields WHERE form_config_id = welcome_config_id;
  END IF;

  -- Insert static content for header and consent
  DELETE FROM public.form_static_content WHERE form_config_id = welcome_config_id;
  
  INSERT INTO public.form_static_content (form_config_id, content_key, content_type, content)
  VALUES
    (welcome_config_id, 'header', 'html', '<div class="text-center mb-6"><h1 class="text-3xl font-bold mb-4">WELCOME TO POJ</h1><p class="text-muted-foreground mb-4">GIVING US YOUR DETAILS WILL ENABLE US TO CONTACT YOU VIA EMAIL OR PHONE (CONSENT)</p></div>');

  -- WELCOME FORM FIELDS - Complete version
  INSERT INTO public.form_fields (
    form_config_id, field_key, field_type, label, placeholder, is_required,
    display_order, db_column, transformation_type, transformation_config,
    is_notes_field, notes_format, options, validation_rules, section
  ) VALUES
    -- Personal Information
    (welcome_config_id, 'gender', 'select', 'Sex', NULL, true, 1, 'gender', 'direct', '{}'::jsonb, false, NULL, '[{"label": "Male", "value": "male"}, {"label": "Female", "value": "female"}]'::jsonb, '{}'::jsonb, 'Personal Information'),
    (welcome_config_id, 'marital_status', 'select', 'Marital Status', NULL, true, 2, 'marital_status', 'direct', '{}'::jsonb, false, NULL, '[{"label": "Single", "value": "single"}, {"label": "Married", "value": "married"}, {"label": "Divorced", "value": "divorced"}, {"label": "Widowed", "value": "widowed"}]'::jsonb, '{}'::jsonb, 'Personal Information'),
    (welcome_config_id, 'first_name', 'text', 'First Name', 'Enter your first name', true, 3, NULL, 'combine', '{"fields": ["first_name", "surname"], "separator": " ", "target": "full_name"}'::jsonb, false, NULL, NULL::jsonb, '{}'::jsonb, 'Personal Information'),
    (welcome_config_id, 'surname', 'text', 'Surname', 'Enter your surname', true, 4, 'surname', 'combine', '{"fields": ["first_name", "surname"], "separator": " ", "target": "full_name"}'::jsonb, false, NULL, NULL::jsonb, '{}'::jsonb, 'Personal Information'),
    
    -- Address Information
    (welcome_config_id, 'address', 'textarea', 'Address', 'Enter your full address', true, 5, 'address', 'direct', '{}'::jsonb, false, NULL, NULL::jsonb, '{}'::jsonb, 'Address Information'),
    (welcome_config_id, 'postcode', 'text', 'Postcode', 'Enter your postcode', true, 6, 'postcode', 'direct', '{}'::jsonb, false, NULL, NULL::jsonb, '{}'::jsonb, 'Address Information'),
    
    -- Contact Information
    (welcome_config_id, 'phone', 'tel', 'Phone Number', 'Enter your phone number', false, 7, 'phone', 'direct', '{}'::jsonb, false, NULL, NULL::jsonb, '{}'::jsonb, 'Contact Information'),
    (welcome_config_id, 'whatsapp_number', 'tel', 'WhatsApp Number', 'Enter your WhatsApp number', false, 8, 'whatsapp_number', 'direct', '{}'::jsonb, false, NULL, NULL::jsonb, '{}'::jsonb, 'Contact Information'),
    (welcome_config_id, 'email', 'email', 'Email', 'Enter your email address', false, 9, 'email', 'direct', '{}'::jsonb, false, NULL, NULL::jsonb, '{}'::jsonb, 'Contact Information'),
    
    -- Engagement Questions
    (welcome_config_id, 'joining_us', 'select', 'Are you joining us?', NULL, false, 10, NULL, 'notes', '{}'::jsonb, true, 'Joining us: {value}', '[{"label": "Yes", "value": "Yes"}, {"label": "No", "value": "No"}]'::jsonb, '{}'::jsonb, 'Engagement'),
    (welcome_config_id, 'can_visit', 'select', 'Can we visit?', NULL, false, 11, NULL, 'notes', '{}'::jsonb, true, 'Can visit: {value}', '[{"label": "Yes", "value": "Yes"}, {"label": "No", "value": "No"}]'::jsonb, '{}'::jsonb, 'Engagement'),
    (welcome_config_id, 'whatsapp_group', 'select', 'Will you like to be added to our WhatsApp Group?', 'If yes please, click on this link', true, 12, NULL, 'notes', '{}'::jsonb, true, 'WhatsApp Group: {value}', '[{"label": "Yes", "value": "Yes"}, {"label": "No", "value": "No"}]'::jsonb, '{}'::jsonb, 'Engagement')
  ON CONFLICT (form_config_id, field_key) DO UPDATE SET
    field_type = EXCLUDED.field_type,
    label = EXCLUDED.label,
    placeholder = EXCLUDED.placeholder,
    is_required = EXCLUDED.is_required,
    display_order = EXCLUDED.display_order,
    db_column = EXCLUDED.db_column,
    transformation_type = EXCLUDED.transformation_type,
    transformation_config = EXCLUDED.transformation_config,
    is_notes_field = EXCLUDED.is_notes_field,
    notes_format = EXCLUDED.notes_format,
    options = EXCLUDED.options,
    validation_rules = EXCLUDED.validation_rules,
    section = EXCLUDED.section;

END $$;

