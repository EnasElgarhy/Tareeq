import Image from "next/image";
import Link from "next/link";
import { Thread } from "./Thread";

export const Hero = () => (
  <section className="field hero" aria-labelledby="hero-heading">
    <div className="field__inner hero__inner">
      <Thread />
      <div className="hero__copy">
        <div className="hero__lede">
          <h1 id="hero-heading" className="display">
            Lost at the crossroads?
            <br />
            Daybreak is coming.
          </h1>
          <p className="lead">
            A science-based assessment that shows you which career paths would
            fit you best.
          </p>
        </div>

        <div className="actions">
          <Link
            href="/start"
            className="btn btn--gold"
            data-testid="hero-cta-start"
          >
            Start answering the questions
          </Link>
          <Link
            href="#how"
            className="btn btn--quiet"
            data-testid="hero-cta-how"
          >
            How it works
          </Link>
        </div>
      </div>

      <div className="hero__stage" aria-hidden="true">
        <Image
          src="/marketing/khatt/question.png"
          alt=""
          width={390}
          height={800}
          priority
          className="hero__device"
          sizes="(min-width: 60rem) 20rem, 0px"
        />
      </div>
    </div>
  </section>
);
