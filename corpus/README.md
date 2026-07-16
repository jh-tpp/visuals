# AskTPP research corpus

`manifest.json` is the source registry for the AskTPP corpus. Every PDF in
`pdfs/` must have exactly one manifest entry, including its publication status,
official URL, file hash, aliases, and answer policy.

## Build stages

1. `npm run corpus:build` verifies the registry and PDF hashes, extracts text
   page by page with Poppler, and writes `generated/pages.json` and
   `generated/chunks.json`.
2. `npm run corpus:embed` embeds `retrieval_text` through OpenRouter and writes
   `generated/corpus.json`, which the live `/api/chat` route reads.

## Local OpenRouter credential

Store the server-side credential in the repository-root `.env.local` file:

```dotenv
OPENROUTER_API_KEY=your-key-here
```

`.env.local` is excluded from Git. Restrict it to the current macOS user with
`chmod 600 .env.local`. The `corpus:embed` command loads this file automatically;
never pass the key directly on the command line or add a `NEXT_PUBLIC_` prefix.

The extraction stage requires the Poppler `pdftotext` command. Generated
chunks never cross PDF page boundaries, so every excerpt retains a defensible
page citation. Text is divided at paragraph and sentence boundaries rather
than at arbitrary character positions.

## Preliminary-paper policy

`paper1.pdf` is included because its concepts and methods are important to the
collection. It is a preliminary working paper even though that status is not
printed on its cover. Its manifest policy permits conceptual use but restricts
quantitative reporting: the assistant must not proactively report its numbers
or describe them as final, and must defer numerical questions to a forthcoming
final version.

## Updating a source

When replacing a PDF with a newer version:

1. update the manifest metadata and SHA-256 hash;
2. rebuild pages and chunks;
3. inspect the corpus audit output;
4. rebuild embeddings;
5. run retrieval and answer evaluations before deploying.

Do not silently replace a PDF without updating the manifest. A hash mismatch
is intended to stop the build.
