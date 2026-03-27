"use client"

import * as React from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { ChevronDown, MessageCircleQuestion } from "lucide-react"

const FAQs = [
  {
    question: "كيف أطلب منتج؟",
    answer: "تقدر تطلب أي منتج بكل سهولة! بس ضيف المنتجات اللي محتاجها للسلة، وبعدين اضغط على 'إتمام الطلب'، دخل بياناتك وعنوانك، واكد الطلب. الموضوع مش هياخد منك دقيقتين."
  },
  {
    question: "ما هي طرق الدفع المتاحة؟",
    answer: "حالياً إحنا بنوفر خدمة الدفع كاش عند الاستلام (Cash on Delivery). يعني مش هتدفع أي حاجة غير لما تستلم طلبك وتتأكد منه بنفسك."
  },
  {
    question: "هل التوصيل متاح لكل المناطق؟",
    answer: "حالياً التوصيل متاح داخل قرية ميت العامل فقط، وقريبًا هنبدأ نوصل القرى المجاورة. رسوم الشحن بتظهرلك بوضوح قبل ما تأكد الطلب."
  },
  {
    question: "كم يستغرق التوصيل؟",
    answer: "في أغلب الأحيان بنوصل طلبك في نفس اليوم أو خلال 24 ساعة كحد أقصى، عشان عارفين إنك محتاج حاجتك 'في السكة' بسرعة."
  },
  {
    question: "هل يمكن إرجاع المنتج لو مش مطابق؟",
    answer: "أكيد! حقك محفوظ بالكامل. لو استلمت منتج غير مطابق للمواصفات أو فيه مشكلة عيب صناعة، تقدر ترفض الاستلام وقتها، أو تتواصل مع خدمة العملاء خلال 14 يوم للإرجاع بشرط إن المنتج يكون بحالته الأصلية."
  },
  {
    question: "كيف أتواصل مع الدعم الفني؟",
    answer: "إحنا موجودين عشانك في أي وقت! تقدر تتواصل معانا عن طريق صفحة 'تواصل معنا' أو تبعتلنا مسج على الواتساب على رقم خدمة العملاء المذكور في الموقع."
  }
]

export default function FAQPage() {
  // Using state to control the completely custom accordion feel if wanted, 
  // but html details/summary is generally sufficient with some CSS tricks. 
  // For a premium smooth feel in React, a controlled state is often better.
  const [openIndex, setOpenIndex] = React.useState<number | null>(0)

  return (
    <>
      <Header />
      
      <main className="flex-1 pb-24 md:pb-16 bg-background">
        
        {/* Subtle decorative background glow */}
        <div className="fixed top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 blur-[120px] rounded-[100%] pointer-events-none -z-10"></div>

        {/* Hero Section */}
        <section className="relative px-4 pt-12 pb-8 sm:pt-16 sm:pb-12 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center justify-center p-3 sm:p-4 bg-primary/10 rounded-2xl sm:rounded-3xl mb-4 sm:mb-6 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
            <MessageCircleQuestion className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading font-black text-foreground mb-3 sm:mb-4 tracking-tight drop-shadow-sm">
            الأسئلة الشائعة
          </h1>
          <p className="text-sm sm:text-base text-gray-500 max-w-xl mx-auto leading-relaxed">
            جمعنالك هنا أكتر الأسئلة اللي ممكن تدور في بالك عشان نسهل عليك تجربة التسوق في "في السكة". لو في حاجة تانية، إحنا دايماً موجودين!
          </p>
        </section>

        {/* FAQ Accordion List */}
        <section className="px-4 pb-12 sm:pb-20 max-w-3xl mx-auto">
          <div className="space-y-3 sm:space-y-4">
            {FAQs.map((faq, index) => {
              const isOpen = openIndex === index;
              return (
                <div 
                  key={index}
                  className={`border rounded-2xl overflow-hidden transition-all duration-300 ${
                    isOpen 
                      ? "bg-surface-container/60 border-primary/30 shadow-premium backdrop-blur-lg" 
                      : "bg-surface-container-low/50 border-surface-border/50 hover:border-surface-border shadow-sm backdrop-blur-md"
                  }`}
                >
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="w-full flex items-center justify-between p-4 sm:p-5 text-start focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                  >
                    <span className="font-heading font-bold text-foreground text-sm sm:text-base ml-4">
                      {faq.question}
                    </span>
                    <div className={`flex items-center justify-center shrink-0 w-8 h-8 rounded-full transition-all duration-300 ${
                      isOpen ? "bg-primary text-white rotate-180" : "bg-background text-gray-500 group-hover:text-foreground"
                    }`}>
                      <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                  </button>
                  
                  {/* Smooth height transition wrapper */}
                  <div 
                    className={`grid transition-all duration-300 ease-in-out ${
                      isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="p-4 sm:p-5 pt-0 sm:pt-0 text-sm sm:text-base text-gray-500 leading-relaxed border-t border-surface-hover/30 border-dashed">
                        {faq.answer}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

      </main>

      <Footer />
    </>
  )
}
