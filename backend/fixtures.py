"""Synthetic Maria Conti records. Conversation detail deliberately stays out of the EHR."""

PATIENT = {"id": "maria-conti", "name": "Maria Conti", "dateOfBirth": "1968-03-14"}
DEMO_DATE = "2026-09-26"


def document(id, category, date, title, passages, kind="Visit note"):
    return {
        "id": id, "category": category, "date": date, "patient": PATIENT["name"],
        "title": title, "kind": kind, "author": "Synthetic demo record",
        "sections": [{"paragraphs": [
            {"label": label, "spans": [{"id": passage_id, "text": text}]}
            for passage_id, label, text in passages
        ]}],
    }


SOURCES = [
    document("ehr-baseline", "ehr", "2025-10-15", "Diabetes diagnosis", [
        ("history", "History", "Maria Conti, retired schoolteacher, lives with her husband and gardens frequently. Never smoked; a glass of wine on Sundays. No family history of diabetes."),
        ("diagnosis", "Diagnosis", "Type 2 diabetes diagnosed today. Metformin started. Longstanding hypertension treated with ramipril."),
        ("weight", "Weight", "Weight: 78 kg."),
    ]),
    document("ehr-february", "ehr", "2026-02-12", "Diabetes review", [
        ("review", "Review", "Discussed diet and weight reduction."),
        ("weight", "Weight", "Weight: 72 kg."),
    ]),
    document("call-february", "live-transcript", "2026-02-12", "February conversation", [
        ("intro", "01:58", "Clinician: How have you been getting on since the diabetes diagnosis?"),
        ("diet", "02:10–02:25", "Maria: I put the weight loss down to changing my diet after the diabetes diagnosis. I have been eating smaller portions."),
        ("appetite", "02:25–02:42", "Maria: I am not as hungry as I used to be, either. Sometimes I don't feel like finishing a meal."),
        ("context", "02:43", "Clinician: Thank you for explaining that. Let me make a note of your weight today."),
    ], "Historical transcript"),
    document("ehr-june", "ehr", "2026-06-04", "Telephone encounter note", [
        ("medication", "Medication", "Metformin discontinuation recorded today. Reason: GI intolerance."),
        ("weight", "Weight", "Patient-reported weight: 68 kg."),
    ]),
    document("call-june", "live-transcript", "2026-06-04", "June follow-up conversation", [
        ("intro", "03:58", "Clinician: Are you still taking the metformin?"),
        ("stopped-metformin", "04:12–04:24", "Maria: No, I stopped taking metformin around the middle of May, about two weeks ago. I thought it was giving me diarrhea."),
        ("stool-description", "04:24–04:39", "Maria: The stools were greasy and pale. They floated and were hard to flush."),
        ("question", "04:39–04:43", "Clinician: Did the diarrhea get better after you stopped?"),
        ("persistent-symptoms", "04:43–05:03", "Maria: No, the diarrhea has not improved at all, even two weeks after stopping metformin. My appetite has dropped as well."),
        ("pain-question", "06:10–06:18", "Clinician: Have you had any pain?"),
        ("back-pain", "06:18–06:45", "Maria: I have had back pain between my shoulder blades. I thought it was from all the gardening I've been doing."),
        ("end", "06:46", "Clinician: Thank you for telling me about that."),
    ], "Historical transcript"),
    document("ehr-today", "ehr", DEMO_DATE, "Current visit observations", [
        ("presentation", "Today", "Maria presents with new yellow eyes. The cause has not been established."),
        ("weight", "Weight", "Weight: 66 kg."),
    ]),
]

# Structured observations link back to passages, rather than duplicating facts in answers.
WEIGHTS = [
    {"date": "2025-10-15", "kg": 78, "sourceId": "ehr-baseline", "passageId": "weight"},
    {"date": "2026-02-12", "kg": 72, "sourceId": "ehr-february", "passageId": "weight"},
    {"date": "2026-06-04", "kg": 68, "sourceId": "ehr-june", "passageId": "weight"},
    {"date": DEMO_DATE, "kg": 66, "sourceId": "ehr-today", "passageId": "weight"},
]
