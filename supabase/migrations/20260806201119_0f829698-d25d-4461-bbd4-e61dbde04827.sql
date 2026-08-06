-- Allow public access to read objects in content-covers
create policy "content_covers_public_read"
on storage.objects for select
to public
using ( bucket_id = 'content-covers' );

-- Allow admins to upload to content-covers
create policy "content_covers_admin_upload"
on storage.objects for insert
to authenticated
with check ( 
  bucket_id = 'content-covers' 
  AND public.has_role(auth.uid(), 'admin')
);

-- Allow admins to update objects in content-covers
create policy "content_covers_admin_update"
on storage.objects for update
to authenticated
using ( 
  bucket_id = 'content-covers' 
  AND public.has_role(auth.uid(), 'admin')
);

-- Allow admins to delete objects from content-covers
create policy "content_covers_admin_delete"
on storage.objects for delete
to authenticated
using ( 
  bucket_id = 'content-covers' 
  AND public.has_role(auth.uid(), 'admin')
);