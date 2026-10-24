import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ_ITEMS = [
  {
    q: "Lexa bepulmi?",
    a: "Ha. Ro'yxatdan o'ting va cheklovsiz to'plamlar yarating, kartochkalar hamda aqlli o'rganish rejimidan foydalaning.",
  },
  {
    q: "Aqlli o'rganish rejimi qanday ishlaydi?",
    a: "Tizim har bir so'z bo'yicha javoblaringizni kuzatadi. Xato qilgan so'zlaringiz tez-tez, yaxshi bilgan so'zlaringiz esa kamroq takrorlanadi. So'zlar kichik guruhlarda asta-sekin qo'shiladi.",
  },
  {
    q: "So'zlarni Excel yoki Google Docs'dan ko'chirsam bo'ladimi?",
    a: "Albatta. Ommaviy import oynasiga matnni joylashtiring, ajratuvchini tanlang (Tab, vergul yoki o'zingizniki) va natijani darhol ko'ring. CSV fayl yuklash ham mumkin.",
  },
  {
    q: "To'plamlarimni boshqalar ko'ra oladimi?",
    a: "Buni o'zingiz hal qilasiz: to'plam hammaga ochiq, parol bilan himoyalangan yoki faqat siz uchun bo'lishi mumkin.",
  },
  {
    q: "Telefonda ishlaydimi?",
    a: "Ha. Lexa barcha qurilmalarga moslashgan: telefonda kartochkalarni surib (swipe) o'rganishingiz mumkin.",
  },
] as const;

export function Faq() {
  return (
    <Accordion type="single" collapsible className="w-full">
      {FAQ_ITEMS.map((item, i) => (
        <AccordionItem key={item.q} value={`item-${i}`}>
          <AccordionTrigger>{item.q}</AccordionTrigger>
          <AccordionContent>{item.a}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
