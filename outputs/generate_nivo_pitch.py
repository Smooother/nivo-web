import base64
import datetime
import os
import textwrap
from xml.sax.saxutils import escape
from zipfile import ZipFile, ZIP_DEFLATED

OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "nivo_group_pitch_deck.pptx")
BASE64_OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "nivo_group_pitch_deck.base64")

SLIDES = [
    {
        "title": "Nivo Group – Investment & Strategy Overview",
        "subtitle": "A portfolio of actively managed Swedish SMEs with tech-enhanced sourcing and AI-supported value creation",
        "body": [
            "Technology-enhanced sourcing meets relationship-driven ownership transitions",
            "Purpose-built to deliver disciplined, efficient growth across the Nordic economy"
        ],
        "notes": [
            "Frame the deck as Nivo Group's overview of strategy and positioning.",
            "Underline the blend of proprietary technology and hands-on portfolio management."
        ]
    },
    {
        "title": "Executive Summary – The Opportunity in Short",
        "body": [
            "Macro normalization is pushing businesses toward sustainable, efficient growth.",
            "A second wave of digitalization is unlocking new levers through AI, automation, and structured data.",
            "Nivo targets stable, profitable Swedish SMEs with low volatility and modern efficiency potential.",
            "Our proprietary data platform scans thousands of companies to surface overlooked acquisition targets.",
            "We refine to a ~50 company shortlist, then engage founders through human-first outreach.",
            "Backed by long-term capital and operators, we aim to build a high-quality SME portfolio delivering 4–5x MoM returns."
        ],
        "notes": [
            "Deliver a concise overview of market forces, Nivo's sourcing edge, and the return ambition.",
            "Set expectations for the depth of technology plus human partnership across the presentation."
        ]
    },
    {
        "title": "Why Now – Efficient Growth Is the New Normal",
        "body": [
            "2010–2020: very low capital costs enabled growth-at-all-costs, rapid scaling, and topline obsession.",
            "2021–2023: high capital costs forced profit obsession, freezes, cuts, and margin prioritization.",
            "2024 and beyond: normalizing capital costs reward efficient growth, smart scale, and balanced focus.",
            "AI and automation unlock +5–10% topline gains in digitally enabled consumer sectors.",
            "Automation is driving 30–40% cost savings in overhead-heavy functions like finance, legal, and support."
        ],
        "notes": [
            "Explain the macro eras to highlight the current focus on efficiency.",
            "Quantify how AI-driven improvements change both revenue and cost dynamics for SMEs."
        ]
    },
    {
        "title": "The Nivo Strategy – Sourcing at Scale, Acting with Focus",
        "body": [
            "We acquire Swedish SMEs with strong financial profiles, predictable growth, and clear improvement potential.",
            "Source smart: leverage our proprietary platform to analyze 50,000+ companies across Sweden.",
            "Engage human-first: select 30–50 high-quality targets per cycle and begin founder conversations.",
            "Create value: combine strategic repositioning, cost improvements, and selective AI tooling."
        ],
        "notes": [
            "Describe how the data platform broadens the funnel before the team narrows focus.",
            "Reinforce that disciplined sourcing feeds a high-touch, operator-led value plan."
        ]
    },
    {
        "title": "Target Profile – What We Look For",
        "body": [
            "Strategic criteria: niche or regional strongholds with clear operational upside from tech or process enhancements.",
            "Strategic criteria: aligned management teams ready to collaborate and low exposure to AI displacement risk.",
            "Financial criteria: SEK 30–150M in revenue with ≥5% EBITDA margins sustained over three years.",
            "Financial criteria: healthy balance sheets and outbound-sourced valuations that reward disciplined buyers."
        ],
        "notes": [
            "Clarify both the qualitative and quantitative filters guiding the shortlist.",
            "Highlight the emphasis on resilient operations and collaborative leadership teams."
        ]
    },
    {
        "title": "Outreach Model – Human-First Engagement",
        "body": [
            "Convert platform insights into curated shortlists of 30–50 high-quality companies per origination cycle.",
            "Initiate owner conversations grounded in data, trust, and long-term partnership goals.",
            "Build tailored value-creation roadmaps alongside founders before formal diligence begins."
        ],
        "notes": [
            "Emphasize that technology narrows the field, but people close the deals.",
            "Share examples of how data-backed outreach accelerates rapport with business owners."
        ]
    },
    {
        "title": "Value Creation Playbook – Acquire. Improve. Accelerate.",
        "body": [
            "Acquire: data-driven sourcing via Nivo's internal platform and outbound origination cadence.",
            "Improve: process optimization, cost-structure reviews, and strategic repositioning for resilience.",
            "Accelerate: AI-enabled marketing, automation, expansion initiatives, and selective bolt-on M&A."
        ],
        "notes": [
            "Walk through each phase of the playbook with a supporting example or case idea.",
            "Tie the accelerate step back to measurable AI and automation gains."
        ]
    },
    {
        "title": "Digital Strategy & Pipeline",
        "body": [
            "Continuously scan the full registry of Swedish SMEs using proprietary financial and operational signals.",
            "Filter for operational quality, financial health, and overlooked potential across segments.",
            "Maintain a live pipeline of 200+ identified targets with 30+ active owner dialogues."
        ],
        "notes": [
            "Reiterate how the technology backbone keeps the opportunity set fresh.",
            "Mention that the pipeline metrics demonstrate repeatability and scale."
        ]
    },
    {
        "title": "Niche Focus – Sectors We Like",
        "body": [
            "Industrial and specialty B2B: services, manufacturing, and distribution with sticky relationships.",
            "Home, hobby, and care: improvement, wellness, and enthusiast retail categories with durable demand.",
            "Resilient B2C: recurring needs, large-ticket purchases, and seasonal categories with loyal customers."
        ],
        "notes": [
            "Provide sector examples that link to both stability and modernization upside.",
            "Position these niches as under-served by traditional financial sponsors."
        ]
    },
    {
        "title": "Structure & Returns – Disciplined Model, Aligned Capital",
        "body": [
            "Target portfolio-level returns of 4–5x MoM over a five-year horizon.",
            "Drive EBITDA improvement, apply conservative leverage, and pursue thoughtful multiple expansion.",
            "Capture synergies across the platform while maintaining long-term ownership flexibility."
        ],
        "notes": [
            "Set expectations for return drivers and the investment horizon.",
            "Stress prudence in leverage and disciplined integration to manage downside risk."
        ]
    },
    {
        "title": "Team Experience – Operators with a Technology Lens",
        "body": [
            "Led by investors with 20+ completed transactions and deep Nordic SME expertise.",
            "Seasoned in business development, scaling, and commercial growth strategy.",
            "Hands-on experience deploying AI for operational improvement and due diligence insights."
        ],
        "notes": [
            "Introduce the team's track record across deals, growth, and technology.",
            "Highlight the mix of investment and operator skill sets within Nivo."
        ]
    },
    {
        "title": "Our Philosophy – A Modern Acquirer for the Nordic Economy",
        "body": [
            "Commit to long-term ownership of real businesses across Sweden.",
            "Use technology as an execution edge rather than a standalone product.",
            "Prioritize founder-focused relationships anchored in trust and transparency.",
            "Build the most disciplined SME acquirer in Sweden with sustainable, repeatable results."
        ],
        "notes": [
            "Close with the cultural and strategic principles guiding the firm.",
            "Invite the audience to align with a modern yet pragmatic approach to SME investing."
        ]
    }
]

TITLE_COLOR = "2E2A2B"  # Jet Black
BODY_COLOR = "596152"   # Gray Olive
BACKGROUND_COLOR = "E6E6E6"  # Platinum
ACCENT_COLOR = "2E2A2B"
TITLE_FONT = "Zapf Humanist 601"
BODY_FONT = "Poppins"

SLIDE_WIDTH = 12192000
SLIDE_HEIGHT = 6858000


def paragraphs_xml(lines, font=BODY_FONT, color=BODY_COLOR, level=0, bold=False, size=2400):
    paragraphs = []
    for idx, line in enumerate(lines):
        text = escape(line)
        bold_attr = ' b="1"' if bold else ''
        bullet = """
        <a:pPr lvl=\"{lvl}\">
          <a:lnSpc>
            <a:spcPts val=\"1200\"/>
          </a:lnSpc>
          <a:spcBef>
            <a:spcPts val=\"120\"/>
          </a:spcBef>
          <a:spcAft>
            <a:spcPts val=\"120\"/>
          </a:spcAft>
          <a:buFont typeface=\"{font}\"/>
          <a:buChar char=\"•\"/>
        </a:pPr>
        """.format(lvl=level, font=escape(font))
        run = f"""
        <a:r>
          <a:rPr lang=\"en-US\" sz=\"{size}\"{bold_attr} dirty=\"0\" smtClean=\"0\" typeface=\"{escape(font)}\"/>
          <a:solidFill>
            <a:srgbClr val=\"{color}\"/>
          </a:solidFill>
          <a:t>{text}</a:t>
        </a:r>
        """
        para = f"""
        <a:p>
          {bullet}
          {run}
        </a:p>
        """
        paragraphs.append(para)
    end_para = f"""
    <a:p>
      <a:pPr lvl=\"{level}\"/>
      <a:endParaRPr lang=\"en-US\" sz=\"{size}\" typeface=\"{escape(font)}\"/>
    </a:p>
    """
    paragraphs.append(end_para)
    return "".join(paragraphs)


def single_paragraph(text, font=TITLE_FONT, color=TITLE_COLOR, size=4400, bold=True):
    text = escape(text)
    bold_attr = ' b="1"' if bold else ''
    return f"""
    <a:p>
      <a:pPr>
        <a:lnSpc>
          <a:spcPts val=\"1200\"/>
        </a:lnSpc>
      </a:pPr>
      <a:r>
        <a:rPr lang=\"en-US\" sz=\"{size}\"{bold_attr} dirty=\"0\" smtClean=\"0\" typeface=\"{escape(font)}\"/>
        <a:solidFill>
          <a:srgbClr val=\"{color}\"/>
        </a:solidFill>
        <a:t>{text}</a:t>
      </a:r>
      <a:endParaRPr lang=\"en-US\" sz=\"{size}\" typeface=\"{escape(font)}\"/>
    </a:p>
    """


def body_shape_xml(body_lines):
    return f"""
    <p:sp>
      <p:nvSpPr>
        <p:cNvPr id=\"3\" name=\"Content Placeholder 2\"/>
        <p:cNvSpPr txBox=\"1\"/>
        <p:nvPr/>
      </p:nvSpPr>
      <p:spPr>
        <a:xfrm>
          <a:off x=\"685800\" y=\"1905000\"/>
          <a:ext cx=\"7772400\" cy=\"3810000\"/>
        </a:xfrm>
        <a:prstGeom prst=\"rect\">
          <a:avLst/>
        </a:prstGeom>
        <a:solidFill>
          <a:srgbClr val=\"FFFFFF\"/>
        </a:solidFill>
      </p:spPr>
      <p:txBody>
        <a:bodyPr wrap=\"square\" rtlCol=\"0\" anchor=\"t\"/>
        <a:lstStyle/>
        {paragraphs_xml(body_lines)}
      </p:txBody>
    </p:sp>
    """


def title_shape_xml(title):
    return f"""
    <p:sp>
      <p:nvSpPr>
        <p:cNvPr id=\"2\" name=\"Title 1\"/>
        <p:cNvSpPr txBox=\"1\"/>
        <p:nvPr/>
      </p:nvSpPr>
      <p:spPr>
        <a:xfrm>
          <a:off x=\"685800\" y=\"685800\"/>
          <a:ext cx=\"7772400\" cy=\"685800\"/>
        </a:xfrm>
        <a:prstGeom prst=\"rect\">
          <a:avLst/>
        </a:prstGeom>
        <a:ln>
          <a:solidFill>
            <a:srgbClr val=\"{ACCENT_COLOR}\"/>
          </a:solidFill>
        </a:ln>
      </p:spPr>
      <p:txBody>
        <a:bodyPr wrap=\"square\" rtlCol=\"0\" anchor=\"ctr\"/>
        <a:lstStyle/>
        {single_paragraph(title)}
      </p:txBody>
    </p:sp>
    """


def subtitle_shape_xml(subtitle):
    return f"""
    <p:sp>
      <p:nvSpPr>
        <p:cNvPr id=\"4\" name=\"Subtitle\"/>
        <p:cNvSpPr txBox=\"1\"/>
        <p:nvPr/>
      </p:nvSpPr>
      <p:spPr>
        <a:xfrm>
          <a:off x=\"685800\" y=\"1333500\"/>
          <a:ext cx=\"7772400\" cy=\"609600\"/>
        </a:xfrm>
        <a:prstGeom prst=\"rect\">
          <a:avLst/>
        </a:prstGeom>
      </p:spPr>
      <p:txBody>
        <a:bodyPr wrap=\"square\" rtlCol=\"0\" anchor=\"t\"/>
        <a:lstStyle/>
        {single_paragraph(subtitle, font=BODY_FONT, color=BODY_COLOR, size=2800, bold=False)}
      </p:txBody>
    </p:sp>
    """


def build_slide_xml(index, slide):
    has_subtitle = "subtitle" in slide and slide["subtitle"]
    body_lines = slide.get("body", [])
    shapes = [title_shape_xml(slide["title"])]
    if has_subtitle:
        shapes.append(subtitle_shape_xml(slide["subtitle"]))
    if body_lines:
        shapes.append(body_shape_xml(body_lines))
    shape_xml = "".join(shapes)
    return f"""
<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>
<p:sld xmlns:a=\"http://schemas.openxmlformats.org/drawingml/2006/main\" xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\" xmlns:p=\"http://schemas.openxmlformats.org/presentationml/2006/main\">
  <p:cSld>
    <p:bg>
      <p:bgPr>
        <a:solidFill>
          <a:srgbClr val=\"{BACKGROUND_COLOR}\"/>
        </a:solidFill>
      </p:bgPr>
    </p:bg>
    <p:spTree>
      <p:nvGrpSpPr>
        <p:cNvPr id=\"1\" name=\"\"/>
        <p:cNvGrpSpPr/>
        <p:nvPr/>
      </p:nvGrpSpPr>
      <p:grpSpPr>
        <a:xfrm>
          <a:off x=\"0\" y=\"0\"/>
          <a:ext cx=\"{SLIDE_WIDTH}\" cy=\"{SLIDE_HEIGHT}\"/>
          <a:chOff x=\"0\" y=\"0\"/>
          <a:chExt cx=\"{SLIDE_WIDTH}\" cy=\"{SLIDE_HEIGHT}\"/>
        </a:xfrm>
      </p:grpSpPr>
      {shape_xml}
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr>
    <a:masterClrMapping/>
  </p:clrMapOvr>
</p:sld>
"""


def build_slide_rels_xml(index, include_notes):
    rels = [
        "<Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout\" Target=\"../slideLayouts/slideLayout1.xml\"/>"
    ]
    if include_notes:
        rels.append(
            f"<Relationship Id=\"rId2\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/notesSlide\" Target=\"../notesSlides/notesSlide{index}.xml\"/>"
        )
    body = "".join(rels)
    return f"""
<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>
<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">
  {body}
</Relationships>
"""


def build_notes_xml(index, slide):
    paragraphs = paragraphs_xml(slide.get("notes", []), font=BODY_FONT, color=BODY_COLOR, level=0, bold=False, size=2000)
    return f"""
<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>
<p:notes xmlns:a=\"http://schemas.openxmlformats.org/drawingml/2006/main\" xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\" xmlns:p=\"http://schemas.openxmlformats.org/presentationml/2006/main\">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr>
        <p:cNvPr id=\"1\" name=\"\"/>
        <p:cNvGrpSpPr/>
        <p:nvPr/>
      </p:nvGrpSpPr>
      <p:grpSpPr>
        <a:xfrm>
          <a:off x=\"0\" y=\"0\"/>
          <a:ext cx=\"6858000\" cy=\"9144000\"/>
          <a:chOff x=\"0\" y=\"0\"/>
          <a:chExt cx=\"6858000\" cy=\"9144000\"/>
        </a:xfrm>
      </p:grpSpPr>
      <p:sp>
        <p:nvSpPr>
          <p:cNvPr id=\"2\" name=\"Notes Placeholder 1\"/>
          <p:cNvSpPr txBox=\"1\"/>
          <p:nvPr>
            <p:ph type=\"body\"/>
          </p:nvPr>
        </p:nvSpPr>
        <p:spPr>
          <a:xfrm>
            <a:off x=\"457200\" y=\"685800\"/>
            <a:ext cx=\"5943600\" cy=\"7772400\"/>
          </a:xfrm>
          <a:prstGeom prst=\"rect\">
            <a:avLst/>
          </a:prstGeom>
        </p:spPr>
        <p:txBody>
          <a:bodyPr wrap=\"square\" rtlCol=\"0\" anchor=\"t\"/>
          <a:lstStyle/>
          {paragraphs}
        </p:txBody>
      </p:sp>
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr>
    <a:masterClrMapping/>
  </p:clrMapOvr>
</p:notes>
"""


def build_notes_rels_xml(index):
    return f"""
<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>
<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">
  <Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide\" Target=\"../slides/slide{index}.xml\"/>
  <Relationship Id=\"rId2\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/notesMaster\" Target=\"../notesMasters/notesMaster1.xml\"/>
</Relationships>
"""

CONTENT_TYPES_TEMPLATE = """<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>
<Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\">
  <Default Extension=\"rels\" ContentType=\"application/vnd.openxmlformats-package.relationships+xml\"/>
  <Default Extension=\"xml\" ContentType=\"application/xml\"/>
  <Override PartName=\"/ppt/presentation.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml\"/>
  <Override PartName=\"/ppt/slideMasters/slideMaster1.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml\"/>
  <Override PartName=\"/ppt/slideLayouts/slideLayout1.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml\"/>
  <Override PartName=\"/ppt/theme/theme1.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.theme+xml\"/>
  <Override PartName=\"/ppt/notesMasters/notesMaster1.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.presentationml.notesMaster+xml\"/>
  <Override PartName=\"/docProps/core.xml\" ContentType=\"application/vnd.openxmlformats-package.core-properties+xml\"/>
  <Override PartName=\"/docProps/app.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.extended-properties+xml\"/>
  {slide_overrides}
  {notes_overrides}
</Types>
"""


def build_content_types(slide_count):
    slide_overrides = []
    notes_overrides = []
    for idx in range(1, slide_count + 1):
        slide_overrides.append(f'<Override PartName="/ppt/slides/slide{idx}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>')
        notes_overrides.append(f'<Override PartName="/ppt/notesSlides/notesSlide{idx}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.notesSlide+xml"/>')
    slide_overrides_str = "\n  ".join(slide_overrides)
    notes_overrides_str = "\n  ".join(notes_overrides)
    return CONTENT_TYPES_TEMPLATE.format(slide_overrides=slide_overrides_str, notes_overrides=notes_overrides_str)

TOP_LEVEL_RELS = """<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>
<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">
  <Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument\" Target=\"ppt/presentation.xml\"/>
  <Relationship Id=\"rId2\" Type=\"http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties\" Target=\"docProps/core.xml\"/>
  <Relationship Id=\"rId3\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties\" Target=\"docProps/app.xml\"/>
</Relationships>
"""

APP_XML = """<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>
<Properties xmlns=\"http://schemas.openxmlformats.org/officeDocument/2006/extended-properties\" xmlns:vt=\"http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes\">
  <Application>Microsoft PowerPoint</Application>
  <PresentationFormat>On-screen Show (16:9)</PresentationFormat>
  <Slides>{slide_count}</Slides>
  <Notes>{slide_count}</Notes>
  <Company>Nivo Group</Company>
</Properties>
"""

CORE_XML_TEMPLATE = """<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>
<cp:coreProperties xmlns:cp=\"http://schemas.openxmlformats.org/package/2006/metadata/core-properties\" xmlns:dc=\"http://purl.org/dc/elements/1.1/\" xmlns:dcterms=\"http://purl.org/dc/terms/\" xmlns:dcmitype=\"http://purl.org/dc/dcmitype/\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\">
  <dc:title>Nivo Group Investor Presentation</dc:title>
  <dc:creator>Nivo Group</dc:creator>
  <cp:lastModifiedBy>Automated Generator</cp:lastModifiedBy>
  <dcterms:created xsi:type=\"dcterms:W3CDTF\">{timestamp}</dcterms:created>
  <dcterms:modified xsi:type=\"dcterms:W3CDTF\">{timestamp}</dcterms:modified>
  <dc:subject>Investor Presentation</dc:subject>
  <dc:description>Pitch deck outlining Nivo Group strategy and investment thesis.</dc:description>
</cp:coreProperties>
"""

PRESENTATION_XML_TEMPLATE = """<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>
<p:presentation xmlns:a=\"http://schemas.openxmlformats.org/drawingml/2006/main\" xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\" xmlns:p=\"http://schemas.openxmlformats.org/presentationml/2006/main\">
  <p:sldMasterIdLst>
    <p:sldMasterId id=\"2147483648\" r:id=\"rId1\"/>
  </p:sldMasterIdLst>
  <p:sldIdLst>
    {slide_id_entries}
  </p:sldIdLst>
  <p:sldSz cx=\"12192000\" cy=\"6858000\" type=\"screen16x9\"/>
  <p:notesSz cx=\"6858000\" cy=\"9144000\"/>
  <p:defaultTextStyle>
    <a:defPPr>
      <a:defRPr lang=\"en-US\" sz=\"2400\" kern=\"1200\"/>
    </a:defPPr>
    <a:lvl1pPr marL=\"0\" algn=\"l\">
      <a:defRPr sz=\"2400\"/>
    </a:lvl1pPr>
  </p:defaultTextStyle>
</p:presentation>
"""

PRESENTATION_RELS_TEMPLATE = """<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>
<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">
  <Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster\" Target=\"slideMasters/slideMaster1.xml\"/>
  {slide_rel_entries}
</Relationships>
"""

SLIDE_MASTER_XML = """<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>
<p:sldMaster xmlns:a=\"http://schemas.openxmlformats.org/drawingml/2006/main\" xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\" xmlns:p=\"http://schemas.openxmlformats.org/presentationml/2006/main\">
  <p:cSld>
    <p:bg>
      <p:bgPr>
        <a:solidFill>
          <a:srgbClr val=\"{BACKGROUND_COLOR}\"/>
        </a:solidFill>
      </p:bgPr>
    </p:bg>
    <p:spTree>
      <p:nvGrpSpPr>
        <p:cNvPr id=\"1\" name=\"\"/>
        <p:cNvGrpSpPr/>
        <p:nvPr/>
      </p:nvGrpSpPr>
      <p:grpSpPr>
        <a:xfrm>
          <a:off x=\"0\" y=\"0\"/>
          <a:ext cx=\"{SLIDE_WIDTH}\" cy=\"{SLIDE_HEIGHT}\"/>
          <a:chOff x=\"0\" y=\"0\"/>
          <a:chExt cx=\"{SLIDE_WIDTH}\" cy=\"{SLIDE_HEIGHT}\"/>
        </a:xfrm>
      </p:grpSpPr>
    </p:spTree>
  </p:cSld>
  <p:clrMap accent1=\"363636\" accent2=\"5B9BD5\" accent3=\"70AD47\" accent4=\"FFC000\" accent5=\"4472C4\" accent6=\"ED7D31\" bg1=\"lt1\" bg2=\"lt2\" folHlink=\"folHlink\" hlink=\"hlink\" tx1=\"dk1\" tx2=\"dk2\"/>
  <p:sldLayoutIdLst>
    <p:sldLayoutId id=\"1\" r:id=\"rId1\"/>
  </p:sldLayoutIdLst>
  <p:txStyles>
    <p:titleStyle>
      <a:lvl1pPr>
        <a:defRPr sz=\"4400\" b=\"1\" typeface=\"{TITLE_FONT}\"/>
      </a:lvl1pPr>
    </p:titleStyle>
    <p:bodyStyle>
      <a:lvl1pPr>
        <a:defRPr sz=\"2400\" typeface=\"{BODY_FONT}\"/>
      </a:lvl1pPr>
    </p:bodyStyle>
    <p:otherStyle>
      <a:defPPr>
        <a:defRPr typeface=\"{BODY_FONT}\"/>
      </a:defPPr>
    </p:otherStyle>
  </p:txStyles>
</p:sldMaster>
"""

SLIDE_MASTER_RELS = """<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>
<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">
  <Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout\" Target=\"../slideLayouts/slideLayout1.xml\"/>
  <Relationship Id=\"rId2\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme\" Target=\"../theme/theme1.xml\"/>
</Relationships>
"""

SLIDE_LAYOUT_XML = """<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>
<p:sldLayout xmlns:a=\"http://schemas.openxmlformats.org/drawingml/2006/main\" xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\" xmlns:p=\"http://schemas.openxmlformats.org/presentationml/2006/main\" type=\"blank\" preserve=\"1\">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr>
        <p:cNvPr id=\"1\" name=\"\"/>
        <p:cNvGrpSpPr/>
        <p:nvPr/>
      </p:nvGrpSpPr>
      <p:grpSpPr>
        <a:xfrm>
          <a:off x=\"0\" y=\"0\"/>
          <a:ext cx=\"{SLIDE_WIDTH}\" cy=\"{SLIDE_HEIGHT}\"/>
          <a:chOff x=\"0\" y=\"0\"/>
          <a:chExt cx=\"{SLIDE_WIDTH}\" cy=\"{SLIDE_HEIGHT}\"/>
        </a:xfrm>
      </p:grpSpPr>
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr>
    <a:masterClrMapping/>
  </p:clrMapOvr>
</p:sldLayout>
"""

SLIDE_LAYOUT_RELS = """<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>
<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">
  <Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster\" Target=\"../slideMasters/slideMaster1.xml\"/>
</Relationships>
"""

THEME_XML = """<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>
<a:theme xmlns:a=\"http://schemas.openxmlformats.org/drawingml/2006/main\" name=\"NivoTheme\">
  <a:themeElements>
    <a:clrScheme name=\"NivoColors\">
      <a:dk1><a:srgbClr val=\"2E2A2B\"/></a:dk1>
      <a:lt1><a:srgbClr val=\"E6E6E6\"/></a:lt1>
      <a:dk2><a:srgbClr val=\"000000\"/></a:dk2>
      <a:lt2><a:srgbClr val=\"FFFFFF\"/></a:lt2>
      <a:accent1><a:srgbClr val=\"596152\"/></a:accent1>
      <a:accent2><a:srgbClr val=\"2E2A2B\"/></a:accent2>
      <a:accent3><a:srgbClr val=\"8A9180\"/></a:accent3>
      <a:accent4><a:srgbClr val=\"A8AD9B\"/></a:accent4>
      <a:accent5><a:srgbClr val=\"C7C9BF\"/></a:accent5>
      <a:accent6><a:srgbClr val=\"FFFFFF\"/></a:accent6>
      <a:hlink><a:srgbClr val=\"2E2A2B\"/></a:hlink>
      <a:folHlink><a:srgbClr val=\"596152\"/></a:folHlink>
    </a:clrScheme>
    <a:fontScheme name=\"NivoFonts\">
      <a:majorFont>
        <a:latin typeface=\"{TITLE_FONT}\"/>
        <a:ea typeface=\"{TITLE_FONT}\"/>
        <a:cs typeface=\"{TITLE_FONT}\"/>
      </a:majorFont>
      <a:minorFont>
        <a:latin typeface=\"{BODY_FONT}\"/>
        <a:ea typeface=\"{BODY_FONT}\"/>
        <a:cs typeface=\"{BODY_FONT}\"/>
      </a:minorFont>
    </a:fontScheme>
    <a:fmtScheme name=\"NivoFormat\">
      <a:fillStyleLst>
        <a:solidFill><a:srgbClr val=\"E6E6E6\"/></a:solidFill>
        <a:solidFill><a:srgbClr val=\"FFFFFF\"/></a:solidFill>
      </a:fillStyleLst>
      <a:lnStyleLst>
        <a:ln w=\"25400\"><a:solidFill><a:srgbClr val=\"2E2A2B\"/></a:solidFill></a:ln>
      </a:lnStyleLst>
      <a:effectStyleLst/>
      <a:bgFillStyleLst>
        <a:solidFill><a:srgbClr val=\"E6E6E6\"/></a:solidFill>
      </a:bgFillStyleLst>
    </a:fmtScheme>
  </a:themeElements>
</a:theme>
"""

NOTES_MASTER_XML = """<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>
<p:notesMaster xmlns:a=\"http://schemas.openxmlformats.org/drawingml/2006/main\" xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\" xmlns:p=\"http://schemas.openxmlformats.org/presentationml/2006/main\">
  <p:cSld>
    <p:bg>
      <p:bgPr>
        <a:solidFill>
          <a:srgbClr val=\"FFFFFF\"/>
        </a:solidFill>
      </p:bgPr>
    </p:bg>
    <p:spTree>
      <p:nvGrpSpPr>
        <p:cNvPr id=\"1\" name=\"\"/>
        <p:cNvGrpSpPr/>
        <p:nvPr/>
      </p:nvGrpSpPr>
      <p:grpSpPr>
        <a:xfrm>
          <a:off x=\"0\" y=\"0\"/>
          <a:ext cx=\"6858000\" cy=\"9144000\"/>
          <a:chOff x=\"0\" y=\"0\"/>
          <a:chExt cx=\"6858000\" cy=\"9144000\"/>
        </a:xfrm>
      </p:grpSpPr>
    </p:spTree>
  </p:cSld>
  <p:clrMap accent1=\"accent1\" accent2=\"accent2\" accent3=\"accent3\" accent4=\"accent4\" accent5=\"accent5\" accent6=\"accent6\" bg1=\"lt1\" bg2=\"lt2\" folHlink=\"folHlink\" hlink=\"hlink\" tx1=\"dk1\" tx2=\"lt1\"/>
  <p:txStyles>
    <p:otherStyle>
      <a:defPPr>
        <a:defRPr sz=\"2000\" typeface=\"{BODY_FONT}\"/>
      </a:defPPr>
    </p:otherStyle>
  </p:txStyles>
</p:notesMaster>
"""

NOTES_MASTER_RELS = """<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>
<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">
  <Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme\" Target=\"../theme/theme1.xml\"/>
</Relationships>
"""


def write_base64_copy(binary_path, base64_path):
    with open(binary_path, "rb") as source:
        encoded = base64.b64encode(source.read()).decode("ascii")
    wrapped = "\n".join(textwrap.wrap(encoded, 76)) + "\n"
    with open(base64_path, "w", encoding="utf-8") as target:
        target.write(wrapped)


def build_presentation(slides, output_path=OUTPUT_PATH, base64_path=BASE64_OUTPUT_PATH):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    slide_count = len(slides)
    timestamp = datetime.datetime.utcnow().replace(microsecond=0).isoformat() + "Z"

    slide_id_entries = []
    slide_rel_entries = []
    for idx in range(1, slide_count + 1):
        slide_id_entries.append(f'<p:sldId id="{255 + idx}" r:id="rId{idx + 1}"/>')
        slide_rel_entries.append(f'<Relationship Id="rId{idx + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide{idx}.xml"/>')

    presentation_xml = PRESENTATION_XML_TEMPLATE.format(slide_id_entries="\n    ".join(slide_id_entries))
    presentation_rels_xml = PRESENTATION_RELS_TEMPLATE.format(slide_rel_entries="\n  ".join(slide_rel_entries))
    core_xml = CORE_XML_TEMPLATE.format(timestamp=timestamp)
    content_types_xml = build_content_types(slide_count)
    app_xml = APP_XML.format(slide_count=slide_count)

    with ZipFile(output_path, "w", ZIP_DEFLATED) as pptx:
        pptx.writestr("[Content_Types].xml", content_types_xml)
        pptx.writestr("_rels/.rels", TOP_LEVEL_RELS)
        pptx.writestr("docProps/app.xml", app_xml)
        pptx.writestr("docProps/core.xml", core_xml)
        pptx.writestr("ppt/presentation.xml", presentation_xml)
        pptx.writestr("ppt/_rels/presentation.xml.rels", presentation_rels_xml)
        pptx.writestr("ppt/slideMasters/slideMaster1.xml", SLIDE_MASTER_XML)
        pptx.writestr("ppt/slideMasters/_rels/slideMaster1.xml.rels", SLIDE_MASTER_RELS)
        pptx.writestr("ppt/slideLayouts/slideLayout1.xml", SLIDE_LAYOUT_XML)
        pptx.writestr("ppt/slideLayouts/_rels/slideLayout1.xml.rels", SLIDE_LAYOUT_RELS)
        pptx.writestr("ppt/theme/theme1.xml", THEME_XML)
        pptx.writestr("ppt/notesMasters/notesMaster1.xml", NOTES_MASTER_XML)
        pptx.writestr("ppt/notesMasters/_rels/notesMaster1.xml.rels", NOTES_MASTER_RELS)

        for idx, slide in enumerate(slides, start=1):
            pptx.writestr(f"ppt/slides/slide{idx}.xml", build_slide_xml(idx, slide))
            pptx.writestr(f"ppt/slides/_rels/slide{idx}.xml.rels", build_slide_rels_xml(idx, True))
            pptx.writestr(f"ppt/notesSlides/notesSlide{idx}.xml", build_notes_xml(idx, slide))
            pptx.writestr(f"ppt/notesSlides/_rels/notesSlide{idx}.xml.rels", build_notes_rels_xml(idx))

    if base64_path:
        write_base64_copy(output_path, base64_path)

    return output_path, base64_path


if __name__ == "__main__":
    pptx_path, base64_path = build_presentation(SLIDES)
    print(f"Created presentation at {pptx_path}")
    if base64_path:
        print(
            "Base64 copy written to {0}. Decode with `base64 -d {0} > nivo_group_pitch_deck.pptx`"
            .format(base64_path)
        )
