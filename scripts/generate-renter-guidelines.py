"""Regenerate public/renter-guidelines.pdf from the app's operational checklists.
Run from the repository root with reportlab installed.
"""
import json
import subprocess
from xml.sax.saxutils import escape
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from pathlib import Path

font_root = Path("/usr/share/fonts/truetype/dejavu")
pdfmetrics.registerFont(TTFont("Guidelines", str(font_root / "DejaVuSans.ttf")))
pdfmetrics.registerFont(TTFont("Guidelines-Bold", str(font_root / "DejaVuSans-Bold.ttf")))
pdfmetrics.registerFontFamily("Guidelines", normal="Guidelines", bold="Guidelines-Bold")
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak

source = subprocess.check_output(['node', '--import', 'tsx', '--input-type=module', '-e', '''
import { pickupChecklist, returnChecklist } from './src/lib/booking/communications.ts';
const contact = { pickupAddress: '', pickupInstructions: 'Arrive at your scheduled pickup time. Bring your valid driver’s license and proof of insurance. Wait for our representative before connecting or moving the trailer.', supportPhone: '210-269-3467', supportEmail: 'booking@alamocityhitchandgo.com' };
console.log(JSON.stringify({pickup: pickupChecklist(contact), returns: returnChecklist(contact)}));
'''], text=True)
content = json.loads(source)
navy = colors.HexColor('#11151D')
red = colors.HexColor('#B32224')
body = ParagraphStyle('body', fontName='Guidelines', fontSize=11, leading=16, textColor=navy, spaceAfter=12)
heading = ParagraphStyle('heading', fontName='Guidelines-Bold', fontSize=26, leading=30, textColor=navy, spaceAfter=16)
label = ParagraphStyle('label', fontName='Guidelines-Bold', fontSize=10, leading=14, textColor=red, spaceAfter=10)
intro = ParagraphStyle('intro', parent=body, textColor=colors.HexColor('#555B64'), spaceAfter=22)

def chrome(canvas, doc):
    canvas.setFillColor(red)
    canvas.rect(42, 747, 528, 4, fill=1, stroke=0)
    canvas.setFont('Guidelines-Bold', 10)
    canvas.setFillColor(navy)
    canvas.drawString(42, 764, 'ALAMO CITY HITCH & GO')
    canvas.setFont('Guidelines', 8)
    canvas.setFillColor(colors.HexColor('#555B64'))
    canvas.drawString(42, 30, 'Rental checklist | Keep alongside your signed rental agreement')
    canvas.drawRightString(570, 30, str(doc.page))

story = []
for index, (title, items) in enumerate([('Before pickup', content['pickup']), ('Before return', content['returns'])]):
    if index: story.append(PageBreak())
    story += [Paragraph('RULES & GUIDELINES', label), Paragraph(title, heading), Paragraph('Check your command center for your trailer, scheduled times, and confirmed handoff location. All rental times are shown in Central Time.', intro)]
    for number, item in enumerate(items, 1):
        story.append(Paragraph(f'<b>{number:02d}.</b>  {escape(item)}', body))
        story.append(Spacer(1, 5))
SimpleDocTemplate('public/renter-guidelines.pdf', pagesize=(612,792), leftMargin=42, rightMargin=42, topMargin=65, bottomMargin=52, title='Rules & Guidelines - Alamo City Hitch & Go', author='Alamo City Hitch & Go').build(story, onFirstPage=chrome, onLaterPages=chrome)
