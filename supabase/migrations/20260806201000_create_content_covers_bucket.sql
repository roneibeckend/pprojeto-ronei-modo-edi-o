-- Create the bucket
insert into storage.buckets (id, name, public)
values ('content-covers', 'content-covers', true)
on conflict (id) do nothing;

-- Set up RLS for the bucket
-- Allow public access to read
create policy "Public Access"
on storage.objects for select
to public
using ( bucket_id = 'content-covers' );

-- Allow authenticated users to upload
create policy "Authenticated users can upload"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'content-covers' );

-- Allow authenticated users to update/delete their own objects (or all if admin)
create policy "Users can update their own objects"
on storage.objects for update
to authenticated
using ( bucket_id = 'content-covers' );

create policy "Users can delete their own objects"
on storage.objects for delete
to authenticated
using ( bucket_id = 'content-covers' );
