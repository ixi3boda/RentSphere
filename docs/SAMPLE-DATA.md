# Sample dataset

The screenshots in the root README are taken against a small, hand-written dataset that
stands in for real market activity: nine listings, three tenants, one owner, and the leases
and instalments those listings generate. It is deliberately different from
[`../Database/seed-large-dataset.sql`](../Database/seed-large-dataset.sql), which exists only
to give the load tests 100k rows to chew on.

## Load it

```bash
docker compose exec -T mysql mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" \
  RentSphereSchema < Database/Schema.sql
docker compose exec -T mysql mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" \
  RentSphereSchema < Database/seed-demo.sql
```

`seed-demo.sql` truncates its eight tables first, so it is safe to re-run, and it is safe to
run the large seed afterwards (it truncates the same tables in turn).

The listing photos are served by the frontend out of
[`../Frontend/public/uploads/demo`](../Frontend/public/uploads/demo), so no external image
host is needed and the demo works offline.

## Demo logins

All four accounts share the password `RentSphereDemo2026`. `password_hash` in the SQL file is
the BCrypt digest the API produced, not the plain text. These accounts exist only in whatever
database you load this file into, so the password is public on purpose — it is what makes the
demo runnable. Nothing here is (or should be) a credential you use anywhere else.

| Account | Email | Role | What it shows |
|---|---|---|---|
| Nour El-Sayed (Nile Nest) | `nour.elsayed@nilenest.demo` | ADMIN | Owns all nine listings: admin console, incoming requests, lease management |
| Youssef Farouk | `youssef.farouk@mail.demo` | TENANT | One active lease on the Maadi apartment (3 instalments paid), three saved listings, one pending and one rejected request |
| Salma Abdel-Nabi | `salma.abdelnabi@mail.demo` | TENANT | One active lease on the Palm Hills villa (1 instalment paid), two pending requests, three saved listings |
| Mariam El-Hosseiny | `mariam.elhosseiny@mail.demo` | TENANT | Two active leases (Corniche apartment, Katameya duplex; 2 instalments paid), two saved listings |

Registration always creates a `VISITOR`, so these rows carry the role promotion the admin
path would apply. Rents are in USD because the app is USD-denominated throughout
(`PropertyForm.js` labels the field "Monthly Rent (USD)" and contracts are created with
`currency: 'USD'`).

## What is in it

| Table | Rows | Notes |
|---|---:|---|
| `users` | 4 | 1 owner + 3 tenants |
| `properties` | 9 | Cairo, New Cairo, 6th of October, Sheikh Zayed, Alexandria ×2, Giza, Riyadh; apartment / studio / villa / office / duplex |
| `property_images` | 11 | the Maadi apartment has three photos so the detail-page carousel has something to page through |
| `rental_requests` | 8 | 4 accepted, 3 pending, 1 rejected |
| `contracts` | 4 | one per accepted request, 6 or 12 months |
| `payments` | 48 | one row per contract month; 6 settled for $5,010, the rest pending with due dates |
| `favorites` | 8 | across the three tenants |
| `notifications` | 16 | request received, request accepted/rejected, contract created, payment received |

Four listings are `is_available = 0` because they are the four under an active lease, so the
home page counters (`9 total · 5 available · 4 active leases`) come out consistent when read
through `GET /api/properties/stats`.

Every row was created by calling the API the way the UI does — register, `properties/add`,
`properties/{id}/images/add`, `favorite`, `rent/request`, `rent/requests/{id}/accept`,
`rent/contracts/{id}/card-payment` — and then dumping the tables. Nothing here was inserted
by hand, so the contracts, instalment schedules and notifications are the same shape the
services write in production.

## Photo credits

The listing photos are freely-licensed stock images, not renders. They are resampled copies
of:

| File | Subject | Author | License | Source |
|---|---|---|---|---|
| `maadi-living.jpg` | Apartment living room | Shixart1985 | CC BY 2.0 | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Modern_living_room_with_stylish_furniture_and_a_view_of_the_outdoors_in_a_cozy_apartment_setting.jpg) |
| `maadi-kitchen.jpg` | Kitchen, white cabinets | wiccahwang | CC BY | [Flickr](https://www.flickr.com/photos/11024830@N03/5481165036) |
| `maadi-bedroom.jpg` | Bedroom | Ken Doerr | CC BY | [Flickr](https://www.flickr.com/photos/45673145@N00/7188059589) |
| `newcairo-studio.jpg` | Apartment interior | Unsplash, via Commons | CC0 | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Home_Sweet_Home_Pt._4_(Unsplash).jpg) |
| `october-villa.jpg` | Villa with pool | Jeda Villa Bali | CC BY | [Flickr](https://www.flickr.com/photos/53779476@N08/5003486228) |
| `sheikhzayed-view.jpg` | Pyramids of Giza | kallerna | CC BY-SA 3.0 | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Giza_pyramids_and_Khufu_boat_pit_2.jpg) |
| `corniche-sea.jpg` | Alexandria corniche | Eassa | CC BY-SA 3.0 | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:The_Corniche_On_The_Mediterranean_In_Alexandria_-_panoramio.jpg) |
| `alex-studio.jpg` | Empty room, corner windows | aismallard | CC BY-SA 3.0 | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Empty_apartment_room_with_corner_windows.jpg) |
| `smartvillage-office.jpg` | Meeting room | Unsplash, via Commons | CC0 | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Minimalist_meeting_room_(Unsplash).jpg) |
| `riyadh-malqa.jpg` | Apartment building | Jason Pratt | CC BY | [Flickr](https://www.flickr.com/photos/84108876@N00/721626479) |
| `heliopolis-duplex.jpg` | Duplex houses | pnwra | CC BY | [Flickr](https://www.flickr.com/photos/17573364@N00/635457117) |

The names and addresses in the listings are invented; the districts, streets and price bands
are real ones for those neighbourhoods.
