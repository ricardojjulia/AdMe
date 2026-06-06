-- Function to handle new users signing up via Supabase Auth
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.users (id, name, avatar, role, rewards_balance, ad_credits_balance)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce(new.raw_user_meta_data->>'avatar_url', ''),
    'consumer',
    0,
    0
  );
  return new;
end;
$$;

-- Trigger to call the function when a new row is inserted into auth.users
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
