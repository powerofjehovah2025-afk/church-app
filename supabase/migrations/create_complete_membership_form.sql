-- Migration: Create complete Membership Form based on Google Form
-- This replaces the simple membership form with the full version from RCCG POJ Essex

DO $$
DECLARE
  membership_config_id UUID;
BEGIN
  -- Get or create membership form config
  SELECT id INTO membership_config_id 
  FROM public.form_configs 
  WHERE form_type = 'membership' 
    AND (status = 'published' OR status IS NULL)
  ORDER BY version DESC
  LIMIT 1;
  
  IF membership_config_id IS NULL THEN
    INSERT INTO public.form_configs (form_type, title, description, is_active, version, status, version_name)
    VALUES ('membership', 'Membership Form', 'RCCG Power of Jehovah, Essex - Membership Registration Form', true, 1, 'published', 'Complete Membership Form')
    RETURNING id INTO membership_config_id;
  ELSE
    -- Update existing config
    UPDATE public.form_configs
    SET version = COALESCE(version, 1), 
        status = 'published',
        version_name = 'Complete Membership Form',
        title = 'Membership Form',
        description = 'RCCG Power of Jehovah, Essex - Membership Registration Form',
        is_active = true
    WHERE id = membership_config_id;
    
    -- Delete existing fields to replace with new ones
    DELETE FROM public.form_fields WHERE form_config_id = membership_config_id;
  END IF;

  -- Insert static content for GDPR and header
  DELETE FROM public.form_static_content WHERE form_config_id = membership_config_id;
  
  INSERT INTO public.form_static_content (form_config_id, content_key, content_type, content)
  VALUES
    (membership_config_id, 'header', 'html', '<div class="text-center mb-6"><h1 class="text-2xl font-bold mb-2">RCCG POWER OF JEHOVAH, ESSEX</h1><h2 class="text-xl mb-2">Membership Form</h2><p class="text-muted-foreground mb-4">Raising Champions for the Present and Future Generations</p><p class="text-sm"><a href="https://www.rccgpojessex.org" class="text-primary" target="_blank">www.rccgpojessex.org</a></p></div>'),
    (membership_config_id, 'gdpr_intro', 'html', '<div class="mb-6 p-4 bg-muted rounded-lg"><h3 class="font-semibold mb-2">GDPR (More Information can be found on the website)</h3><p class="text-sm mb-4">By filling this form you are confirming that you are consenting to the RCCG, POJ, Essex holding and processing your personal data for the following purposes:</p>'),
    (membership_config_id, 'gdpr_contact', 'html', '<p class="text-xs text-muted-foreground mb-4">You can withdraw or change your consent at any time by contacting the Parish Administrator at the RCCG POJ, Chelmsford Administrator at adpojrccg@gmail.com, 01245268928, 07534604839, 07946051013</p></div>');

  -- MEMBERSHIP FORM FIELDS - Complete version
  INSERT INTO public.form_fields (
    form_config_id, field_key, field_type, label, placeholder, is_required,
    display_order, db_column, transformation_type, transformation_config,
    is_notes_field, notes_format, options, validation_rules, section
  ) VALUES
    -- GDPR Consent Fields
    (membership_config_id, 'gdpr_consent_contact', 'checkbox', 'I consent to the church contacting me by phone or email.', NULL, false, 1, 'gdpr_consent', 'direct', '{}'::jsonb, false, NULL, NULL::jsonb, '{}'::jsonb, 'GDPR Consent'),
    (membership_config_id, 'gdpr_consent_news', 'checkbox', 'To keep me informed about news, events, activities, services and administration at the RCCG, POJ, Essex (note you can unsubscribe from the church e-bulletin at any time)', NULL, false, 2, NULL, 'notes', '{}'::jsonb, true, 'GDPR: News consent: {value}', NULL::jsonb, '{}'::jsonb, 'GDPR Consent'),
    (membership_config_id, 'gdpr_consent_whatsapp', 'checkbox', 'To post my name and picture on the church''s WhatsApp group on my birthday.', NULL, false, 3, NULL, 'notes', '{}'::jsonb, true, 'GDPR: WhatsApp birthday post: {value}', NULL::jsonb, '{}'::jsonb, 'GDPR Consent'),
    
    -- Personal Information
    (membership_config_id, 'first_name', 'text', 'First Name', 'Enter your first name', true, 10, NULL, 'combine', '{"fields": ["first_name", "surname"], "separator": " ", "target": "full_name"}'::jsonb, false, NULL, NULL::jsonb, '{}'::jsonb, 'Personal Information'),
    (membership_config_id, 'surname', 'text', 'Surname', 'Enter your surname', true, 11, 'surname', 'combine', '{"fields": ["first_name", "surname"], "separator": " ", "target": "full_name"}'::jsonb, false, NULL, NULL::jsonb, '{}'::jsonb, 'Personal Information'),
    (membership_config_id, 'phone', 'tel', 'Phone Number', 'Enter your phone number', true, 12, 'phone', 'direct', '{}'::jsonb, false, NULL, NULL::jsonb, '{}'::jsonb, 'Personal Information'),
    (membership_config_id, 'whatsapp_number', 'tel', 'WhatsApp Number', 'Enter your WhatsApp number', false, 13, 'whatsapp_number', 'direct', '{}'::jsonb, false, NULL, NULL::jsonb, '{}'::jsonb, 'Personal Information'),
    (membership_config_id, 'email', 'email', 'Email', 'Enter your email address', true, 14, 'email', 'direct', '{}'::jsonb, false, NULL, NULL::jsonb, '{}'::jsonb, 'Personal Information'),
    (membership_config_id, 'gender', 'select', 'Gender', NULL, true, 15, 'gender', 'direct', '{}'::jsonb, false, NULL, '[{"label": "Male", "value": "male"}, {"label": "Female", "value": "female"}]'::jsonb, '{}'::jsonb, 'Personal Information'),
    
    -- Birthday (split into day and month)
    (membership_config_id, 'birthday_month', 'number', 'Birthday - Month', 'MM (1-12)', false, 16, 'birthday_month', 'direct', '{}'::jsonb, false, NULL, NULL::jsonb, '{"min": 1, "max": 12}'::jsonb, 'Personal Information'),
    (membership_config_id, 'birthday_day', 'number', 'Birthday - Day', 'DD (1-31)', false, 17, 'birthday_day', 'direct', '{}'::jsonb, false, NULL, NULL::jsonb, '{"min": 1, "max": 31}'::jsonb, 'Personal Information'),
    
    -- Marital Status
    (membership_config_id, 'marital_status', 'select', 'Status', NULL, true, 18, 'marital_status', 'direct', '{}'::jsonb, false, NULL, '[{"label": "Single", "value": "single"}, {"label": "Married", "value": "married"}, {"label": "Divorced", "value": "divorced"}, {"label": "Widowed", "value": "widowed"}]'::jsonb, '{}'::jsonb, 'Personal Information'),
    
    -- Wedding Anniversary (split into day and month)
    (membership_config_id, 'wedding_anniversary_month', 'number', 'Wedding Anniversary - Month', 'MM (1-12)', false, 19, 'wedding_anniversary_month', 'direct', '{}'::jsonb, false, NULL, NULL::jsonb, '{"min": 1, "max": 12}'::jsonb, 'Personal Information'),
    (membership_config_id, 'wedding_anniversary_day', 'number', 'Wedding Anniversary - Day', 'DD (1-31)', false, 20, 'wedding_anniversary_day', 'direct', '{}'::jsonb, false, NULL, NULL::jsonb, '{"min": 1, "max": 31}'::jsonb, 'Personal Information'),
    
    -- Address Information
    (membership_config_id, 'address', 'textarea', 'Address', 'Enter your full address', false, 21, 'address', 'direct', '{}'::jsonb, false, NULL, NULL::jsonb, '{}'::jsonb, 'Address Information'),
    (membership_config_id, 'postcode', 'text', 'Postcode', 'Enter your postcode', false, 22, 'postcode', 'direct', '{}'::jsonb, false, NULL, NULL::jsonb, '{}'::jsonb, 'Address Information'),
    (membership_config_id, 'town', 'text', 'Town', 'Enter your town', true, 23, NULL, 'notes', '{}'::jsonb, true, 'Town: {value}', NULL::jsonb, '{}'::jsonb, 'Address Information'),
    (membership_config_id, 'parish_chelmsford', 'text', 'Parish in Chelmsford', 'Enter your parish', true, 24, NULL, 'notes', '{}'::jsonb, true, 'Parish in Chelmsford: {value}', NULL::jsonb, '{}'::jsonb, 'Address Information'),
    
    -- Additional Information
    (membership_config_id, 'country_of_origin', 'text', 'What is your country of origin?', 'This helps us collate data for our multi-cultural day.', false, 25, 'country_of_origin', 'direct', '{}'::jsonb, false, NULL, NULL::jsonb, '{}'::jsonb, 'Additional Information'),
    (membership_config_id, 'transport_mode', 'select', 'Means of Transport to Church', NULL, false, 26, 'transport_mode', 'direct', '{}'::jsonb, false, NULL, '[{"label": "Church''s Transport Team", "value": "church_transport"}, {"label": "Taxi", "value": "taxi"}, {"label": "Public Transport", "value": "public_transport"}, {"label": "My Car", "value": "car"}]'::jsonb, '{}'::jsonb, 'Additional Information'),
    (membership_config_id, 'start_date', 'date', 'When approximately did you start attending RCCG POJ Essex regularly?', NULL, true, 27, 'start_date', 'direct', '{}'::jsonb, false, NULL, NULL::jsonb, '{}'::jsonb, 'Additional Information'),
    
    -- Spiritual Information
    (membership_config_id, 'is_born_again', 'select', 'Are you Born Again?', 'Have you given your life to Jesus Christ, by making Him your Lord and Saviour?', true, 28, 'is_born_again', 'direct', '{}'::jsonb, false, NULL, '[{"label": "Yes", "value": "Yes"}, {"label": "No", "value": "No"}, {"label": "I don''t know", "value": "I don''t know"}]'::jsonb, '{}'::jsonb, 'Spiritual Information'),
    (membership_config_id, 'born_again_details', 'textarea', 'If yes, when and where did you become Born Again?', 'Enter details', false, 29, NULL, 'notes', '{}'::jsonb, true, 'Born Again details: {value}', NULL::jsonb, '{}'::jsonb, 'Spiritual Information'),
    (membership_config_id, 'baptism_status', 'select', 'Have you been baptised by immersion as a believer?', 'This is done after giving your life to Christ, by being fully immersed in water like our Lord Jesus Christ at river Jordan.', true, 30, 'baptism_status', 'direct', '{"boolean_mapping": {"Yes": true, "No": false}}'::jsonb, false, NULL, '[{"label": "Yes", "value": "Yes"}, {"label": "No", "value": "No"}]'::jsonb, '{}'::jsonb, 'Spiritual Information'),
    (membership_config_id, 'baptism_date', 'text', 'If yes, please when?', 'Enter baptism date', false, 31, NULL, 'notes', '{}'::jsonb, true, 'Baptism date: {value}', NULL::jsonb, '{}'::jsonb, 'Spiritual Information'),
    
    -- Workforce & Department
    (membership_config_id, 'join_workforce', 'select', 'Will you like to join the work force of RCCG POJ Essex?', NULL, false, 32, NULL, 'notes', '{}'::jsonb, true, 'Join workforce: {value}', '[{"label": "Yes", "value": "Yes"}, {"label": "No", "value": "No"}]'::jsonb, '{}'::jsonb, 'Workforce & Department'),
    (membership_config_id, 'departments', 'checkbox', 'Which department will you like to join?', NULL, false, 33, 'department_interest', 'array', '{}'::jsonb, false, NULL, '[{"label": "Choir", "value": "Choir"}, {"label": "Multimedia", "value": "Multimedia"}, {"label": "Evangelism", "value": "Evangelism"}, {"label": "Children''s Teacher", "value": "Children''s Teacher"}, {"label": "Teens Teacher", "value": "Teens Teacher"}, {"label": "Sunday school Teacher", "value": "Sunday school Teacher"}, {"label": "Social Media", "value": "Social Media"}, {"label": "Ushering", "value": "Ushering"}, {"label": "Hospitality Team", "value": "Hospitality Team"}, {"label": "Welcome Team", "value": "Welcome Team"}, {"label": "Parking Team", "value": "Parking Team"}, {"label": "Sanctuary Team", "value": "Sanctuary Team"}, {"label": "Transport Team", "value": "Transport Team"}, {"label": "Decoration Team", "value": "Decoration Team"}, {"label": "Announcement", "value": "Announcement"}, {"label": "Other", "value": "Other"}]'::jsonb, '{}'::jsonb, 'Workforce & Department'),
    
    -- Career Information
    (membership_config_id, 'career_sector', 'text', 'What is your Career or Business Sector?', 'Sector: e.g Health, IT, Construction, Legal, Finance, Hospitality, Tourism etc...', false, 34, 'career_sector', 'direct', '{}'::jsonb, false, NULL, NULL::jsonb, '{}'::jsonb, 'Career Information'),
    (membership_config_id, 'profession', 'text', 'What is your Profession?', 'Profession: e.g Student, Nurse, Project Manager, Business(CEO)', false, 35, 'profession', 'direct', '{}'::jsonb, false, NULL, NULL::jsonb, '{}'::jsonb, 'Career Information'),
    
    -- Family Information
    (membership_config_id, 'has_children', 'select', 'Do you come to church with a child or children?', NULL, true, 36, 'has_children', 'direct', '{"boolean_mapping": {"Yes": true, "No": false}}'::jsonb, false, NULL, '[{"label": "Yes (If yes, please click submit and check your confirmation message for the child form)", "value": "Yes"}, {"label": "No", "value": "No"}]'::jsonb, '{}'::jsonb, 'Family Information')
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

