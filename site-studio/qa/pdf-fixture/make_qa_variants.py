from pathlib import Path
from pypdf import PdfReader, PdfWriter

root=Path(r"E:\dev\PhySecDesign\site-studio")
source=root/"public"/"assets"/"demo-campus-plans.pdf"
dest=root/"qa"/"pdf-fixture"
dest.mkdir(parents=True,exist_ok=True)
reader=PdfReader(source)
labels=reader.page_labels

packet=PdfWriter()
for i in range(9):
    packet.add_page(reader.pages[i%3])
    packet.set_page_label(i,i,prefix=f"{labels[i%3]}-{i//3+1}")
packet.add_metadata({"/Title":"Westbrook Campus - Nine-page QA packet","/Subject":"Internal pagination test fixture","/Author":"PhySec Site Studio QA"})
packet_path=dest/"demo-campus-9-pages.pdf"
with packet_path.open("wb") as stream:packet.write(stream)

encrypted=PdfWriter()
encrypted.clone_document_from_reader(reader)
encrypted.add_metadata({"/Title":"Westbrook Campus - Protected QA fixture","/Subject":"Internal password UI test fixture"})
encrypted.encrypt(user_password="site-studio-test",owner_password="site-studio-test-owner",algorithm="AES-256")
protected_path=dest/"demo-campus-protected.pdf"
with protected_path.open("wb") as stream:encrypted.write(stream)

packet_check=PdfReader(packet_path)
protected_check=PdfReader(protected_path)
assert protected_check.is_encrypted
assert protected_check.decrypt("wrong-test-password")==0
assert protected_check.decrypt("site-studio-test")!=0
assert len(packet_check.pages)==9
assert len(protected_check.pages)==3
print({"packet":str(packet_path),"packet_bytes":packet_path.stat().st_size,"packet_pages":len(packet_check.pages),"packet_labels":packet_check.page_labels,"protected":str(protected_path),"protected_bytes":protected_path.stat().st_size,"protected_pages":len(protected_check.pages),"encryption":"AES-256","password":"site-studio-test"})
