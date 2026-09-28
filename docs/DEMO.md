# A five-minute walkthrough

Use the synthetic Maria Conti case. Start the app and local records service using the
[README instructions](../README.md#run-locally). No AWS credentials or microphone are needed
for the seeded historical-record demonstration.

| Time | Action                                                                           | What to point out                                                                                                                           |
| ---- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 0:00 | Open Notes and type “New yellow eyes. Review what changed since the last visit.” | The clinician owns this space. Recording and chat do not rewrite it.                                                                        |
| 0:30 | Open chat. Ask **Why did she stop metformin?**                                   | The answer retrieves the June conversation, alongside the sparse EHR note.                                                                  |
| 1:15 | Click the citation for persistent symptoms.                                      | The original June transcript opens with the relevant passage highlighted, including its timestamp.                                          |
| 2:00 | Choose **View connections**, then the June conversation node.                    | The graph explains the selected answer's evidence. **Open original passage** returns to the same record viewer.                             |
| 2:45 | Ask **Has her weight changed, and did she say why?**                             | Structured measurements show 78 → 72 → 68 → 66 kg. The February conversation preserves Maria's diet explanation and reduced appetite.       |
| 3:30 | Ask **Did she ever mention back or abdominal pain?**                             | Retrieve the June description of back pain between the shoulder blades and her gardening explanation. Do not reinterpret it as a diagnosis. |
| 4:00 | Open **Sources → Add source → Paste text**.                                      | Import a small fictional note, assign its source category, then retrieve it in a subsequent question.                                       |
| 4:30 | Open Summary and generate the recap.                                             | Current notes and completed transcript passages are extracted on request. This is not model-generated synthesis.                            |

## Suggested imported source

Title: `Patient context — synthetic intake`

Category: `Electronic health records`

Text: `Maria is a retired schoolteacher who lives with her husband. She gardens frequently.`

Follow-up question: **What do the records say about gardening?**

## Optional live transcription segment

Set up and start the separate Whisper server first. Open Transcript, allow microphone access,
and speak an acted, fictional conversation. Watch completed passages appear; search the text
and export WebVTT after at least one segment is available. Only the microphone input is
captured by the current implementation; remote telehealth participants are not automatically
captured. Historical transcript fixtures are not presented as newly recorded audio.

## What this demo does not claim

- No automatic diagnosis, rare-disease detection, clinical risk score or doctor-performance score.
- No production EHR connection, live BioThings lookup or Bedrock generation in this branch.
- No completed imaging order, referral delivery, translated patient letter or cohort screening.
- The graph shows source provenance. An edge does not establish clinical causation.

All screenshots and example people are synthetic. The fixed encounter date is 26 September 2026.
