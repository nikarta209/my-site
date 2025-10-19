create or replace view public.bestsellers_view as
select
  b.id,
  b.title,
  b.cover_images,
  b.genre,
  b.lang,
  b.rating,
  coalesce(s.weekly_sales, 0) as weekly_sales,
  coalesce(s.total_sales, 0)  as total_sales
from public.books b
left join (
  select book_id,
         sum(case when sold_at >= now() - interval '7 days' then quantity else 0 end) as weekly_sales,
         sum(quantity) as total_sales
  from public.sales
  group by book_id
) s on s.book_id = b.id
where b.is_published = true;

create or replace view public.bestsellers_top10 as
select * from public.bestsellers_view
where coalesce(
  nullif(cover_images->>'main_banner', ''),
  nullif(cover_images->>'landscape', ''),
  nullif(cover_images->>'portrait_large', ''),
  nullif(cover_images->>'default', ''),
  nullif(cover_images->>'square', '')
) is not null
order by weekly_sales desc, rating desc
limit 10;
