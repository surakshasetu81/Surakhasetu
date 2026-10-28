"""
Suraksha Setu — Python Verified Legal Knowledge Base
Version: 2026.2

Approved statutes, provisions, official links, and validation logic.
Ensures that the ML model can NEVER invent or hallucinate statutory sections.
"""

from typing import List, Dict, Optional, Any

LEGAL_KB_VERSION = "2026.2"

VERIFIED_KNOWLEDGE_BASE: Dict[str, Dict[str, Any]] = {
    "posh_act_2013": {
        "actName": "Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013",
        "shortName": "POSH Act, 2013",
        "statute": "Act No. 14 of 2013",
        "categoryLabel": "Workplace Sexual Harassment",
        "categoryExplanation": "Reported facts describe unwelcome physical, verbal or non-verbal conduct of a sexual nature in a workplace or employment setting.",
        "provisions": [
            {
                "section": "Section 2(n)",
                "title": "Definition of Sexual Harassment",
                "summary": "Includes unwelcome physical contact and advances, demand or request for sexual favours, sexually coloured remarks, showing pornography, or any other unwelcome physical, verbal or non-verbal conduct of a sexual nature.",
                "applicabilityCondition": "Applies where the conduct is unwelcome and has a sexual overtone in a workplace or employment context.",
                "officialSource": "https://www.indiacode.nic.in/handle/123456789/2104",
            },
            {
                "section": "Section 3",
                "title": "Prevention of Sexual Harassment & Hostile Environment",
                "summary": "Prohibits sexual harassment, including situations where implicit or explicit promises of preferential treatment, threats of detrimental treatment, or creating an intimidating, hostile or offensive work environment are present.",
                "applicabilityCondition": "Requires conduct occurring in connection with or during employment.",
                "officialSource": "https://www.indiacode.nic.in/handle/123456789/2104",
            },
            {
                "section": "Section 4",
                "title": "Constitution of Internal Committee (IC)",
                "summary": "Mandates every employer of a workplace with 10 or more employees to constitute an Internal Committee headed by a senior woman presiding officer, employee members, and an external member committed to women's causes.",
                "applicabilityCondition": "Workplace establishments with 10 or more workers.",
                "officialSource": "https://www.indiacode.nic.in/handle/123456789/2104",
            },
            {
                "section": "Section 12",
                "title": "Interim Relief During Inquiry",
                "summary": "During the pendency of inquiry, the complainant may request transfer, grant leave up to 3 months, or restrain respondent from reporting on work performance.",
                "applicabilityCondition": "Available upon written request to the Internal Committee during active inquiry.",
                "officialSource": "https://www.indiacode.nic.in/handle/123456789/2104",
            },
            {
                "section": "Section 16",
                "title": "Prohibition of Publication of Content of Complaint",
                "summary": "Strictly prohibits publishing or communicating the identity of complainant, respondent, or witnesses, as well as inquiry details to the public or media.",
                "applicabilityCondition": "Mandatory confidentiality across all stages of inquiry.",
                "officialSource": "https://www.indiacode.nic.in/handle/123456789/2104",
            },
        ],
        "officialSources": [
            {"name": "India Code (POSH Act 2013)", "url": "https://www.indiacode.nic.in/handle/123456789/2104"},
            {"name": "Ministry of Women & Child Development Handbook", "url": "https://wcd.nic.in/sites/default/files/Sexual-Harassment-at-Workplace-Act.pdf"},
        ],
        "clarificationPrompts": [
            "Clarify whether the respondent is an employee, manager, contractor, client, or visitor associated with the organization.",
            "Confirm whether the workplace establishment has 10 or more employees and an active Internal Committee (IC).",
        ],
    },
    "bns_2023": {
        "actName": "Bharatiya Nyaya Sanhita, 2023",
        "shortName": "BNS, 2023",
        "statute": "Act No. 45 of 2023",
        "categoryLabel": "Criminal Penal Offences (Rape / Sexual Assault / Stalking / Intimidation)",
        "categoryExplanation": "Reported conduct describes allegations of rape, sexual assault, persistent stalking, cyber tracking, or criminal intimidation under the Bharatiya Nyaya Sanhita, 2023.",
        "provisions": [
            {
                "section": "Section 63",
                "title": "Definition of Rape",
                "summary": "Defines rape as non-consensual sexual acts, sexual penetration of penis or any object/substance into vagina, urethra, anus or mouth against will or without consent.",
                "applicabilityCondition": "Acts of non-consensual sexual penetration or forced sexual intercourse.",
                "officialSource": "https://www.mha.gov.in/",
            },
            {
                "section": "Section 64",
                "title": "Punishment for Rape",
                "summary": "Prescribes rigorous imprisonment of not less than 10 years extending to life imprisonment and fine for the offence of rape.",
                "applicabilityCondition": "Offence of rape under Section 63.",
                "officialSource": "https://www.mha.gov.in/",
            },
            {
                "section": "Section 65",
                "title": "Punishment for Rape in Certain Cases",
                "summary": "Enhanced statutory penalties for rape by persons in authority, public servants, management/staff of hospital or institution, or rape of a woman under eighteen/sixteen years.",
                "applicabilityCondition": "Custodial, institutional, or aggravated circumstances.",
                "officialSource": "https://www.mha.gov.in/",
            },
            {
                "section": "Section 66",
                "title": "Punishment for Causing Death or Persistent Vegetative State",
                "summary": "Penalizes inflicting injury causing death or resulting in persistent vegetative state of the victim during commission of rape.",
                "applicabilityCondition": "Fatal or grievous bodily harm resulting in persistent vegetative state.",
                "officialSource": "https://www.mha.gov.in/",
            },
            {
                "section": "Section 74",
                "title": "Assault or Criminal Force with Intent to Outrage Modesty",
                "summary": "Penalizes assaulting or using criminal force against any woman, intending to outrage or knowing it to be likely to outrage her modesty.",
                "applicabilityCondition": "Involves physical force, battery, or assaultive physical contact.",
                "officialSource": "https://www.mha.gov.in/",
            },
            {
                "section": "Section 75",
                "title": "Sexual Harassment",
                "summary": "Defines sexual harassment as physical contact and advances involving unwelcome explicit sexual overtures, demand for sexual favours, showing pornography, or making sexually coloured remarks.",
                "applicabilityCondition": "Criminal complaint for unwelcome sexual acts punishable with imprisonment.",
                "officialSource": "https://www.mha.gov.in/",
            },
            {
                "section": "Section 78",
                "title": "Stalking",
                "summary": "Defines stalking as repeatedly following a woman, contacting or attempting to contact her despite clear disinterest, or monitoring her use of the internet, email, or any other electronic communication.",
                "applicabilityCondition": "Repeated pattern of physical following, unwanted contact, or digital surveillance.",
                "officialSource": "https://www.mha.gov.in/",
            },
            {
                "section": "Section 77",
                "title": "Voyeurism",
                "summary": "Penalizes watching, capturing, or disseminating the image of a woman engaging in a private act under circumstances with reasonable expectation of privacy.",
                "applicabilityCondition": "Unauthorized recording or dissemination of private acts without consent.",
                "officialSource": "https://www.mha.gov.in/",
            },
            {
                "section": "Section 351",
                "title": "Criminal Intimidation",
                "summary": "Penalizes threatening another with injury to person, reputation or property with intent to cause alarm or compel them to do any act against their will.",
                "applicabilityCondition": "Explicit threats of violence, extortion, or character damage.",
                "officialSource": "https://www.mha.gov.in/",
            },
        ],
        "officialSources": [
            {"name": "Ministry of Home Affairs (MHA — BNS 2023)", "url": "https://www.mha.gov.in/"},
            {"name": "India Code (BNS 2023)", "url": "https://www.indiacode.nic.in/"},
        ],
        "clarificationPrompts": [
            "Clarify whether a formal police complaint (FIR) has been lodged or if parallel criminal redressal is sought.",
            "Specify the timeline, frequency, and electronic or physical evidence of repeated following/threats.",
        ],
    },
    "pocso_act_2012": {
        "actName": "Protection of Children from Sexual Offences Act, 2012",
        "shortName": "POCSO Act, 2012",
        "statute": "Act No. 32 of 2012",
        "categoryLabel": "Child Sexual Exploitation & Safeguarding",
        "categoryExplanation": "Reported concern involves conduct targeting a person below 18 years of age, triggering mandatory statutory child safeguarding procedures.",
        "provisions": [
            {
                "section": "Section 7 & 8",
                "title": "Sexual Assault of a Child",
                "summary": "Defines and penalizes sexual assault against a child with physical sexual touching without penetration.",
                "applicabilityCondition": "Aggrieved person is below 18 years of age at the time of the incident.",
                "officialSource": "https://www.indiacode.nic.in/handle/123456789/2079",
            },
            {
                "section": "Section 11 & 12",
                "title": "Sexual Harassment of a Child",
                "summary": "Penalizes uttering words, making sounds or gestures, exhibiting body parts, repeatedly following or tracking a child with sexual intent.",
                "applicabilityCondition": "Sexual gesture, remark, exhibitionism, or tracking targeting a minor under 18.",
                "officialSource": "https://www.indiacode.nic.in/handle/123456789/2079",
            },
            {
                "section": "Section 19 & 21",
                "title": "Mandatory Reporting of Offences Against Children",
                "summary": "Imposes a strict statutory duty on any person with apprehension or knowledge of an offence against a child to report it to the Special Juvenile Police Unit or local police. Section 21 prescribes penalties for failure to report.",
                "applicabilityCondition": "Mandatory statutory duty for any person or institution with knowledge of offence.",
                "officialSource": "https://www.indiacode.nic.in/handle/123456789/2079",
            },
        ],
        "officialSources": [
            {"name": "India Code (POCSO Act 2012)", "url": "https://www.indiacode.nic.in/handle/123456789/2079"},
            {"name": "National Commission for Protection of Child Rights (NCPCR)", "url": "https://ncpcr.gov.in/"},
        ],
        "clarificationPrompts": [
            "Confirm the exact age of the affected person (under 18 triggers statutory POCSO safeguards).",
            "Confirm whether institutional or school authorities have been alerted pursuant to Section 19.",
        ],
    },
    "ugc_regulations_2015": {
        "actName": "UGC (Prevention, Prohibition and Redressal of Sexual Harassment of Women Employees and Students in Higher Educational Institutions) Regulations, 2015",
        "shortName": "UGC Regulations, 2015",
        "statute": "UGC Notification F.91-1/2013(TFGS)",
        "categoryLabel": "Higher Education Campus Harassment",
        "categoryExplanation": "Reported incident involves women students, scholars, or employees within a university, college, or higher educational institution campus.",
        "provisions": [
            {
                "section": "Regulation 3",
                "title": "Responsibilities of Higher Educational Institutions (HEIs)",
                "summary": "Mandates HEIs to publicly commit to a zero-tolerance policy against sexual harassment, display policy conspicuously on campus and website, conduct orientation sessions, and ensure adequate campus security.",
                "applicabilityCondition": "Universities, deemed universities, and colleges recognized by UGC.",
                "officialSource": "https://www.ugc.gov.in/",
            },
            {
                "section": "Regulation 4",
                "title": "Internal Complaints Committee (ICC) in Higher Education",
                "summary": "Requires every HEI to constitute an ICC consisting of a Presiding Officer (senior woman faculty), two faculty members, two non-teaching staff, three student representatives (if complaint involves students), and an external member.",
                "applicabilityCondition": "Institutions of higher learning; includes mandatory student representation when students are parties.",
                "officialSource": "https://www.ugc.gov.in/",
            },
            {
                "section": "Regulation 5",
                "title": "Grievance Redressal Process & Student Protections",
                "summary": "Sets out the inquiry procedure, timeline (completion within 90 days), and interim protections including campus restriction for respondent, hostel room reallocation, or examination accommodations for aggrieved student.",
                "applicabilityCondition": "Aggrieved student or employee seeking time-bound campus redressal.",
                "officialSource": "https://www.ugc.gov.in/",
            },
        ],
        "officialSources": [
            {"name": "University Grants Commission (UGC Regulations)", "url": "https://www.ugc.gov.in/"},
            {"name": "Saksham Guidelines (UGC)", "url": "https://www.ugc.gov.in/pdfnews/7203627_saksham-book.pdf"},
        ],
        "clarificationPrompts": [
            "Confirm whether the academic institution is a university, affiliated college, or autonomous institution recognized by UGC.",
            "Clarify whether the parties involved are students, research scholars, teaching faculty, or administrative staff.",
        ],
    },
    "it_act_2000": {
        "actName": "Information Technology Act, 2000",
        "shortName": "IT Act, 2000",
        "statute": "Act No. 21 of 2000",
        "categoryLabel": "Cyber Harassment & Digital Privacy Violation",
        "categoryExplanation": "Reported conduct involves computer networks, electronic messaging, fake online profiles, or non-consensual digital dissemination of media.",
        "provisions": [
            {
                "section": "Section 66E",
                "title": "Violation of Privacy",
                "summary": "Penalizes capturing, publishing or transmitting the image of a private area of any person without consent, under circumstances violating the privacy of that person.",
                "applicabilityCondition": "Unauthorized recording or digital distribution of non-consensual images.",
                "officialSource": "https://www.indiacode.nic.in/handle/123456789/1999",
            },
            {
                "section": "Section 67",
                "title": "Publishing or Transmitting Obscene Material Electronically",
                "summary": "Penalizes publishing or transmitting in electronic form any material which is lascivious or appeals to the prurient interest.",
                "applicabilityCondition": "Electronic transmission of obscene texts, images, or media.",
                "officialSource": "https://www.indiacode.nic.in/handle/123456789/1999",
            },
            {
                "section": "Section 67A",
                "title": "Publishing Material Containing Sexually Explicit Act",
                "summary": "Prescribes severe imprisonment for publishing or transmitting material containing sexually explicit acts or conduct in electronic form.",
                "applicabilityCondition": "Electronic transmission or publishing of explicit pornography without consent.",
                "officialSource": "https://www.indiacode.nic.in/handle/123456789/1999",
            },
        ],
        "officialSources": [
            {"name": "India Code (Information Technology Act 2000)", "url": "https://www.indiacode.nic.in/handle/123456789/1999"},
            {"name": "National Cyber Crime Reporting Portal (MHA)", "url": "https://cybercrime.gov.in/"},
        ],
        "clarificationPrompts": [
            "Preserve electronic artifacts (screenshots, URLs, chat headers, phone numbers, or email headers).",
            "Clarify whether the communications were made via corporate network/devices or public social media platforms.",
        ],
    },
    "general_workplace_misconduct": {
        "actName": "Institutional HR Grievance Policy / Service Rules (Non-Statutory Bullying)",
        "shortName": "Internal HR Policy & Grievance Rules",
        "statute": "Organizational Standing Orders / Employment Contract",
        "categoryLabel": "General Workplace Bullying / Non-Sexual Misconduct",
        "categoryExplanation": "The reported conduct involves managerial friction, incivility, or administrative unfairness. It does not contain evidence of sexual overtures, statutory sexual harassment, or physical violence.",
        "provisions": [
            {
                "section": "Institutional Code of Conduct",
                "title": "Employee Grievance Redressal Mechanism",
                "summary": "Standard organizational grievance mechanism handling non-sexual workplace disputes, bullying, unfair appraisal claims, or interpersonal conflicts through HR mediation or Ombudsman.",
                "applicabilityCondition": "Report does not allege sexual harassment or criminal offences, but workplace incivility.",
                "officialSource": "https://labour.gov.in/",
            },
        ],
        "officialSources": [
            {"name": "Ministry of Labour & Employment", "url": "https://labour.gov.in/"},
        ],
        "clarificationPrompts": [
            "Does the reported conduct involve sexual remarks, unwanted physical advances, or demands for sexual favours? If not, the complaint falls under internal HR grievance channels rather than statutory POSH proceedings.",
            "Check whether the organization has an internal Employee Ombudsman or HR Grievance Committee.",
        ],
    },
}


def get_verified_framework(framework_id: str) -> Optional[Dict[str, Any]]:
    return VERIFIED_KNOWLEDGE_BASE.get(framework_id)


def get_candidate_provisions(framework_id: str, requested_sections: Optional[List[str]] = None) -> List[Dict[str, Any]]:
    fw = VERIFIED_KNOWLEDGE_BASE.get(framework_id)
    if not fw:
        return []

    provisions = fw.get("provisions", [])
    if not requested_sections:
        return provisions[:3]  # Return top 3 verified candidate provisions

    # Strict hallucination guard: ONLY return provisions that exist in the verified knowledge base
    return [p for p in provisions if p["section"] in requested_sections]


def get_all_frameworks() -> List[str]:
    return list(VERIFIED_KNOWLEDGE_BASE.keys())


def get_verified_provisions(framework_id: str, specific_sections: Optional[List[str]] = None) -> List[Dict[str, Any]]:
    return get_candidate_provisions(framework_id, specific_sections)


def is_provision_verified(framework_id: str, section_id: str) -> bool:
    fw = VERIFIED_KNOWLEDGE_BASE.get(framework_id)
    if not fw:
        return False
    return any(p["section"] == section_id for p in fw.get("provisions", []))
