from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor, Color, white
from reportlab.lib.pagesizes import A3, landscape
from pathlib import Path
from pypdf import PdfReader

ROOT=Path(r"E:\dev\PhySecDesign\site-studio")
OUT=ROOT/"public"/"assets"/"demo-campus-plans.pdf"
OUT.parent.mkdir(parents=True,exist_ok=True)
TEAL=HexColor("#0b7469"); INK=HexColor("#293831"); GRAY=HexColor("#7b8982")
LINE=HexColor("#bdc6bf"); CREAM=HexColor("#fbfbf5"); PALE=HexColor("#eef4eb")
c=canvas.Canvas(str(OUT),pagesize=landscape(A3),pageCompression=1)
c.setTitle("Westbrook Campus - Fictional Drawing Set")
c.setAuthor("PhySec Site Studio demo")
c.setSubject("Three-page vector fixture for PDF site-plan import and alignment")
def text(x,y,s,size=10,color=INK,bold=False):
    c.setFillColor(color); c.setFont("Helvetica-Bold" if bold else "Helvetica",size); c.drawString(x,y,s)
def centered(x,y,s,size=10,color=INK,bold=False):
    c.setFillColor(color); c.setFont("Helvetica-Bold" if bold else "Helvetica",size); c.drawCentredString(x,y,s)
def box(x,y,w,h,fill=None,stroke=LINE,lw=1):
    c.setStrokeColor(stroke);c.setLineWidth(lw)
    if fill:c.setFillColor(fill)
    c.rect(x,y,w,h,stroke=1,fill=bool(fill))
def line(x1,y1,x2,y2,color=LINE,lw=1):
    c.setStrokeColor(color);c.setLineWidth(lw);c.line(x1,y1,x2,y2)
def header(title,subtitle,sheet,page,portrait=False):
    W,H=A3 if portrait else landscape(A3);c.setPageSize((W,H))
    c.setFillColor(CREAM);c.rect(0,0,W,H,fill=1,stroke=0)
    box(32,32,W-64,H-64,stroke=LINE,lw=.6)
    text(54,H-68,"WESTBROOK CAMPUS",12,TEAL,True)
    text(54,H-101,title,25,INK,True);text(54,H-121,subtitle,10,GRAY)
    line(54,H-139,W-54,H-139,LINE,.8)
    line(54,109,W-54,109,LINE,.8)
    text(54,84,"PHYSEC / SITE STUDIO",10,TEAL,True)
    text(54,66,"FICTIONAL SAMPLE - NOT FOR CONSTRUCTION",8,GRAY)
    text(54,49,"Local PDF import fixture. Locations and dimensions are illustrative.",7.5,GRAY)
    text(W-205,84,sheet,23,TEAL,True);text(W-205,64,"CONCEPT / 16 NOV 2026",8,GRAY)
    text(W-205,49,f"Sheet {page} of 3",8,GRAY)
    return W,H
def north(x,y):
    c.setFillColor(TEAL);p=c.beginPath();p.moveTo(x,y);p.lineTo(x-7,y-26);p.lineTo(x,y-20);p.lineTo(x+7,y-26);p.close();c.drawPath(p,fill=1,stroke=0)
    centered(x,y+8,"N",10,TEAL,True)
def dimension(x1,y1,x2,y2,label):
    line(x1,y1,x2,y2,GRAY,.7)
    if y1==y2:
        line(x1,y1-5,x1,y1+5,GRAY,.7);line(x2,y2-5,x2,y2+5,GRAY,.7);centered((x1+x2)/2,y1+7,label,9,GRAY)
    else:
        line(x1-5,y1,x1+5,y1,GRAY,.7);line(x2-5,y2,x2+5,y2,GRAY,.7)
        c.saveState();c.translate(x1-9,(y1+y2)/2);c.rotate(90);centered(0,0,label,9,GRAY);c.restoreState()
def scale(x,y):
    text(x,y+16,"ILLUSTRATIVE SCALE",7,GRAY)
    for i in range(4):box(x+i*25,y,25,5,TEAL if i%2==0 else white,TEAL,.5)
    text(x,y-12,"0",7,GRAY);text(x+48,y-12,"5",7,GRAY);text(x+91,y-12,"10 m",7,GRAY)
def tree(x,y,r=12):
    c.setFillColor(HexColor("#e3ecdb"));c.setStrokeColor(HexColor("#9caf91"));c.setLineWidth(.6);c.circle(x,y,r,fill=1,stroke=1)
    line(x-3,y,x+3,y,HexColor("#9caf91"),.5);line(x,y-3,x,y+3,HexColor("#9caf91"),.5)
def parking(x,y,n=12,up=True):
    h=36
    for i in range(n+1):line(x+i*25,y,x+i*25,y+h,GRAY,.7)
    line(x,y,x+n*25,y,GRAY,.7)
def room(x,y,w,h,name,code):
    box(x,y,w,h,white,INK,1.2)
    centered(x+w/2,y+h/2+5,name,10,INK,True);centered(x+w/2,y+h/2-10,code,8,GRAY)
def desk(x,y,w=30,h=15):
    box(x,y,w,h,None,LINE,.65);c.setStrokeColor(LINE);c.circle(x+w/2,y-5,4,fill=0,stroke=1)

# A-001 - site context
c.addPageLabel(0,prefix="A-001")
W,H=header("Campus site plan","Building A / property boundary, parking and approach routes","A-001",1)
north(W-80,H-190)
box(125,170,925,460,PALE,GRAY,1)
c.setDash(7,4);box(112,158,951,485,None,TEAL,.9);c.setDash()
text(124,649,"PROPERTY BOUNDARY",8,TEAL,True)
box(140,192,895,80,HexColor("#f0f0ea"),LINE,.8)
box(140,545,895,65,HexColor("#f0f0ea"),LINE,.8)
parking(165,205,14);parking(610,205,15)
parking(165,563,14);parking(610,563,15)
box(350,320,450,190,white,INK,2.8)
box(495,289,160,31,white,INK,1.5)
centered(575,425,"BUILDING A",22,INK,True)
centered(575,402,"GROUND FLOOR / SEE A-101",10,GRAY)
box(816,360,185,90,None,GRAY,1)
centered(909,405,"SERVICE YARD",10,GRAY,True)
line(800,405,816,405,INK,3)
box(555,170,40,119,HexColor("#fffef9"),LINE,.8)
centered(575,306,"MAIN ENTRY",9,TEAL,True)
for x in [170,220,270,850,900,950]:tree(x,295)
for x in [185,245,855,915,975]:tree(x,532,10)
text(150,245,"VISITOR PARKING",8,GRAY);text(780,551,"STAFF PARKING",8,GRAY)
text(150,165,"SOUTH GATE",8,TEAL,True)
line(156,174,156,188,TEAL,.8)
dimension(350,527,800,527,"60.0 m")
dimension(324,320,324,510,"25.0 m")
scale(125,127)
text(780,132,"NORTH ACCESS ROAD",8,GRAY)
c.showPage()

# A-101 - detailed floor drawing
c.addPageLabel(1,prefix="A-101")
W,H=header("Building A - ground floor","Plan corners and wall edges are suitable reference points for alignment","A-101",2)
north(W-80,H-190)
bx,by,bw,bh=212,230,760,410
box(bx,by,bw,bh,white,INK,3.5)
# upper rooms with continuous circulation
room(212,455,135,185,"OFFICE","101")
room(347,455,135,185,"OFFICE","102")
room(482,455,180,185,"MEETING","103")
room(662,455,155,185,"TRAINING","104")
room(817,455,155,185,"OPERATIONS","105")
box(212,397,760,58,HexColor("#f5f7f1"),INK,1.2)
centered(592,419,"MAIN CORRIDOR",9,GRAY)
room(212,230,160,167,"STORAGE","106")
room(372,230,125,167,"IT / COMMS","107")
room(497,230,180,167,"LOBBY","108")
room(677,230,145,167,"STAFF","109")
room(822,230,150,167,"SERVICE","110")
# desks and furniture
for xx in [232,287,367,422,837,902]:
    desk(xx,599)
for xx in [500,550,600]:desk(xx,604,40,18)
for xx in [682,742]:
    for yy in [590,555,520]:desk(xx,yy,50,18)
box(520,492,104,45,None,LINE,.8)
for xx in [526,552,578,604]:
    c.setStrokeColor(LINE);c.circle(xx,486,4,fill=0,stroke=1);c.circle(xx,543,4,fill=0,stroke=1)
for xx in [231,275,319]:
    box(xx,257,26,110,None,LINE,.7)
for yy in [254,282,310,338]:
    box(392,yy,84,16,None,LINE,.7)
box(529,254,115,26,None,LINE,.8)
box(696,251,106,36,None,LINE,.8)
box(845,256,104,28,None,LINE,.8)
# Redraw room identifiers on quiet label plates, above furniture linework.
for x,y,w,h,name,code in [(212,455,135,185,"OFFICE","101"),(347,455,135,185,"OFFICE","102"),(482,455,180,185,"MEETING","103"),(662,455,155,185,"TRAINING","104"),(817,455,155,185,"OPERATIONS","105"),(212,230,160,167,"STORAGE","106"),(372,230,125,167,"IT / COMMS","107"),(497,230,180,167,"LOBBY","108"),(677,230,145,167,"STAFF","109"),(822,230,150,167,"SERVICE","110")]:
    c.setFillColor(white);c.rect(x+w/2-45,y+h/2-15,90,30,fill=1,stroke=0)
    centered(x+w/2,y+h/2+5,name,10,INK,True);centered(x+w/2,y+h/2-10,code,8,GRAY)
# door openings and arcs - use white stroke over partitions
for xx in [267,403,550,724,881]:
    line(xx,455,xx+22,455,white,4)
    line(xx,455,xx,477,GRAY,.8)
    c.setStrokeColor(GRAY);c.setLineWidth(.65);c.arc(xx,455-22,xx+44,455+22,startAng=0,extent=90)
for xx in [274,422,575,733,885]:
    line(xx,397,xx+22,397,white,4)
    line(xx,397,xx,375,GRAY,.8)
    c.setStrokeColor(GRAY);c.setLineWidth(.65);c.arc(xx,375,xx+44,419,startAng=270,extent=90)
# main entrance and side exits
line(558,230,617,230,white,6)
line(558,230,558,200,GRAY,.8);line(617,230,617,200,GRAY,.8)
c.setStrokeColor(GRAY);c.arc(558,200,618,260,startAng=180,extent=90);c.arc(557,200,617,260,startAng=270,extent=90)
centered(587,181,"MAIN ENTRANCE",9,TEAL,True)
line(212,417,212,438,white,6);line(972,417,972,438,white,6)
text(92,422,"WEST EXIT",8,TEAL);text(992,422,"SERVICE EXIT",8,TEAL)
# windows on external edges
for xx in [229,363,505,679,837]:
    line(xx,640,xx+96,640,HexColor("#6a978e"),2)
dimension(212,665,972,665,"80.0 m")
dimension(180,230,180,640,"43.2 m")
for x in [212,972]:
    c.setStrokeColor(TEAL);c.setLineWidth(.7);c.circle(x,640,6,fill=0,stroke=1)
text(212,687,"ALIGNMENT TIP: use matching corners far apart, then verify the remaining walls.",8,TEAL)
scale(212,137)
text(437,141,"ROOMS / WALLS / OPENINGS",8,GRAY)
c.showPage()

# A-201 - portrait roof sheet
c.addPageLabel(2,prefix="A-201")
W,H=header("Roof and plant plan","Building A / rooftop equipment and access","A-201",3,portrait=True)
north(W-80,H-190)
box(190,270,470,650,white,INK,3)
c.setDash(5,4);box(211,291,428,608,None,GRAY,.8);c.setDash()
centered(425,936,"PARAPET / ROOF BOUNDARY",9,TEAL,True)
# plant equipment banks
for yy,name in [(760,"AHU-01"),(555,"AHU-02"),(350,"AHU-03")]:
    box(260,yy,145,100,HexColor("#f1f4ed"),INK,1.2)
    for xx in [286,331,376]:
        c.setStrokeColor(GRAY);c.setLineWidth(.8);c.circle(xx,yy+57,14,fill=0,stroke=1)
    centered(332,yy+20,name,10,INK,True)
    box(454,yy+18,125,64,None,GRAY,.9)
    for x in range(463,572,9):line(x,yy+23,x,yy+77,LINE,.6)
    centered(516,yy+(81 if yy==555 else 91),"SCREEN",8,GRAY)
box(477,653,111,75,None,INK,1.2)
centered(532,690,"ROOF ACCESS",9,TEAL,True)
c.setDash(8,4);line(425,306,425,880,TEAL,1);line(425,690,477,690,TEAL,1);c.setDash()
text(258,244,"DASHED LINE: SERVICE WALKWAY",8,GRAY)
dimension(190,960,660,960,"43.2 m")
dimension(159,270,159,920,"60.0 m")
scale(190,174)
text(380,178,"PORTRAIT SHEET / PAGE SIZE TEST",8,GRAY)
c.showPage()
c.save()
reader=PdfReader(OUT)
print({"path":str(OUT),"bytes":OUT.stat().st_size,"pages":len(reader.pages),"labels":reader.page_labels,"sizes":[[float(p.mediabox.width),float(p.mediabox.height)] for p in reader.pages]})
