-- PanelShelf 2.0: einmal im Supabase SQL Editor ausführen
-- Fügt die unabhängige Markierung für neue Kapitel hinzu und erweitert die Statusliste.
alter table public.manhua_entries
  add column if not exists new_update boolean not null default false;

alter table public.manhua_entries
  drop constraint if exists manhua_entries_status_check;

alter table public.manhua_entries
  add constraint manhua_entries_status_check
  check (status in ('Reading','Waiting for Updates','Plan to Read','On Hold','Completed','Dropped'));
