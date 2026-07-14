"use client";

import Image from "next/image";
import { PORTRAITS } from "@/lib/landing-assets";
import { Container, Eyebrow, FadeIn } from "./Shared";

interface Testimonial {
  quote: string;
  name: string;
  role: string;
  img: string;
}

const testimonials: Testimonial[] = [
  {
    quote:
      "I took the Compass thinking it'd be another boring quiz. Three months later Kai still remembers that I hate memorizing but love figuring things out. It changed what I'm applying for.",
    name: "Layla",
    role: "Student, 17",
    img: PORTRAITS.student1,
  },
  {
    quote:
      "My daughter and I used to argue about her future. Kai gave us a shared language. Now we actually talk about it — calmly, with real information.",
    name: "Omar",
    role: "Parent",
    img: PORTRAITS.adult,
  },
  {
    quote:
      "The plans Kai builds are tiny and doable. I finished a design course, redesigned my school's app for fun, and now I know this is my thing.",
    name: "Sara",
    role: "Student, 16",
    img: PORTRAITS.student2,
  },
  {
    quote:
      "I recommend Tareeq to every student I counsel. It doesn't hand them an answer — it teaches them to understand themselves. That's the real skill.",
    name: "Ms. Rania",
    role: "School counselor",
    img: PORTRAITS.adult,
  },
  {
    quote:
      "I was 100% sure I'd do medicine because everyone said so. Kai never told me not to — it just kept asking better questions. Turns out I love biomedical engineering.",
    name: "Yousef",
    role: "Student, 18",
    img: PORTRAITS.student3,
  },
];

export function Testimonials() {
  return (
    <section id="testimonials" className="py-24 md:py-32">
      <Container>
        <FadeIn className="max-w-2xl">
          <Eyebrow>Real journeys</Eyebrow>
          <h2 className="font-heading text-4xl sm:text-5xl tracking-tight leading-tight font-semibold text-[#2A2118]">
            <span className="font-display font-medium text-grad-warm">&ldquo;This understands me.&rdquo;</span>
          </h2>
          <p className="mt-6 text-lg text-[#5C5142] leading-relaxed">
            Students, parents and teachers — all finding their way with Kai.
          </p>
        </FadeIn>

        <div className="mt-16 columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
          {testimonials.map((t, i) => (
            <FadeIn key={t.name + i} delay={(i % 3) * 0.1} className="break-inside-avoid">
              <figure
                data-testid={`testimonial-card-${i + 1}`}
                className="bg-[#FFFCF6] rounded-[2rem] border border-[rgba(43,36,28,0.1)] shadow-sm hover:shadow-md transition-shadow duration-500 p-8"
              >
                <blockquote className="text-[#2A2118]/85 leading-relaxed">&ldquo;{t.quote}&rdquo;</blockquote>
                <figcaption className="mt-6 flex items-center gap-3">
                  <Image src={t.img} alt={t.name} width={44} height={44} className="rounded-full object-cover" />
                  <div>
                    <p className="font-medium text-[#2A2118] text-sm">{t.name}</p>
                    <p className="text-xs text-[#675D4E]">{t.role}</p>
                  </div>
                </figcaption>
              </figure>
            </FadeIn>
          ))}
        </div>
      </Container>
    </section>
  );
}
