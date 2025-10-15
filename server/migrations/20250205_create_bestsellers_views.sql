-- Kasbook feed sales materialized data
create or replace view public.bestsellers_view as
select
  b.id,
  b.slug,
  b.title,
  b.subtitle,
  b.author,
  b.genre,
  b.genres,
  b.lang,
  b.language,
  b.languages,
  b.rating,
  b.rating_count,
  b.likes_count,
  b.reviews_count,
  b.cover_url,
  b.cover_images,
  b.created_at,
  b.updated_at,
  b.published_at,
  b.release_date,
  b.price_kas,
  b.price_usd,
  b.is_editors_pick,
  b.is_public_domain,
  b.is_in_subscription,
  b.is_exclusive,
  b.is_preview_available,
  b.tags,
  b.status,
  coalesce(s.weekly_sales, 0) as weekly_sales,
  coalesce(s.total_sales, 0)  as total_sales,
  coalesce(s.last_sold_at, b.updated_at) as last_sold_at
from public.books b
left join (
  select
    book_id,
    sum(quantity) filter (where sold_at >= now() - interval '7 days') as weekly_sales,
    sum(quantity) as total_sales,
    max(sold_at) as last_sold_at
  from public.sales
  group by book_id
) s on s.book_id = b.id
where b.is_published = true or b.status = 'approved';

create or replace view public.bestsellers_top10 as
select *
from public.bestsellers_view
where cover_url is not null and trim(cover_url) <> ''
order by weekly_sales desc, rating desc nulls last
limit 10;

comment on view public.bestsellers_view is 'Aggregated sales and metadata for books used by the Kasbook home feed.';
comment on view public.bestsellers_top10 is 'Fast lookup of top-10 bestsellers with covers for hero banners.';

-- Ensure read-only access for anonymous visitors and authors
revoke all on public.bestsellers_view from public;
revoke all on public.bestsellers_top10 from public;

grant select on public.bestsellers_view to anon;
grant select on public.bestsellers_view to authenticated;
grant select on public.bestsellers_view to service_role;

grant select on public.bestsellers_top10 to anon;
grant select on public.bestsellers_top10 to authenticated;
grant select on public.bestsellers_top10 to service_role;

alter view public.bestsellers_view set (security_barrier = true, security_invoker = true);
alter view public.bestsellers_top10 set (security_barrier = true, security_invoker = true);
