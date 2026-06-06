-- Update handle_new_user function to implement privacy-first anonymous UIDs for consumers
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  anon_uid text;
  avatar_char text;
begin
  -- Generate anonymous UID in format UID-XXXX-XXXX using part of the UUID
  anon_uid := 'UID-' || upper(substring(new.id::text from 1 for 4)) || '-' || upper(substring(new.id::text from 10 for 4));
  avatar_char := upper(substring(anon_uid from 5 for 2));

  insert into public.users (id, name, avatar, role, rewards_balance, ad_credits_balance)
  values (
    new.id,
    case 
      when (new.raw_user_meta_data->>'account_type') = 'business' then coalesce(new.raw_user_meta_data->>'full_name', 'Business ' || anon_uid)
      else anon_uid
    end,
    case 
      when (new.raw_user_meta_data->>'account_type') = 'business' then '🏢'
      else avatar_char
    end,
    coalesce(new.raw_user_meta_data->>'account_type', 'consumer'),
    0,
    0
  );
  return new;
end;
$$;
