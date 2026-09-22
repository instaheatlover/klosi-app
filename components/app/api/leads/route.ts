import { NextRequest, NextResponse } from "next/server";

// Lets a Vercel function run longer than the 10s default — pulling
// multiple pages of Google results can take a little while.
export const maxDuration = 60;

const PLACES_ENDPOINT = "https://places.googleapis.com/v1/places:searchText";

// Only asking Google for the fields we actually need keeps each
// search call cheaper.
const FIELD_MASK = [
  "places.displayName",
  "places.formattedAddress",
  "places.nationalPhoneNumber",
  "places.internationalPhoneNumber",
  "places.websiteUri",
  "nextPageToken",
].join(",");

// Google's Text Search returns at most 20 results per page and caps
// out around 60 results total (3 pages) for a given search.
const MAX_PAGES = 3;
const PAGE_SIZE = 20;

type PlaceResult = {
  name: string;
  phone: string;
  website: string;
  address: string;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "The Google Places API key isn't set up on the server yet. Add GOOGLE_PLACES_API_KEY in your Vercel project settings and redeploy.",
      },
      { status: 500 }
    );
  }

  let body: { query?: string; location?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const businessType = (body.query || "").trim();
  const place = (body.location || "").trim();

  if (!businessType || !place) {
    return NextResponse.json(
      { error: "Please provide both a business type and a location." },
      { status: 400 }
    );
  }

  const textQuery = `${businessType} in ${place}`;
  const results: PlaceResult[] = [];

  try {
    let pageToken: string | undefined;
    let pagesFetched = 0;

    do {
      const requestBody: Record<string, unknown> = {
        textQuery,
        pageSize: PAGE_SIZE,
      };
      if (pageToken) requestBody.pageToken = pageToken;

      const res = await fetch(PLACES_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": FIELD_MASK,
        },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(
          `Google Places API returned an error (${res.status}). ${errText.slice(0, 300)}`
        );
      }

      const data = await res.json();
      const places = Array.isArray(data.places) ? data.places : [];

      for (const p of places) {
        results.push({
          name: p.displayName?.text || "",
          phone: p.nationalPhoneNumber || p.internationalPhoneNumber || "",
          website: p.websiteUri || "",
          address: p.formattedAddress || "",
        });
      }

      pageToken = data.nextPageToken;
      pagesFetched += 1;

      // Google needs a brief moment before a freshly issued next-page
      // token can actually be used — without this pause the next
      // request comes back empty.
      if (pageToken && pagesFetched < MAX_PAGES) {
        await sleep(2000);
      }
    } while (pageToken && pagesFetched < MAX_PAGES);

    return NextResponse.json({ results, count: results.length });
  } catch (e: unknown) {
    console.error(e);
    return NextResponse.json(
      {
        error:
          e instanceof Error
            ? e.message
            : "Something went wrong while searching Google Maps.",
        results,
      },
      { status: 500 }
    );
  }
}
