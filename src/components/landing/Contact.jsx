"use client";
import AnimatedTitle from "./AnimatedTitle";
import Button from "./Button";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";

const ImageClipBox = ({ src, clipClass }) => (
  <div className={clipClass}>
    <img src={src} alt="" />
  </div>
);

const Contact = () => {
  const { user, loading } = useAuth();
  // We can't use usePathname here easily because this might be used on pages where we don't want to redirect back?
  // Actually, Contact is usually on landing, so redirecting back to landing is fine.
  // But let's check if we can import usePathname.
  // The file is "use client", so yes.

  const pathname = usePathname();

  return (
    <div id="contact" className="my-20 min-h-96 w-full px-10">
      <div className="relative rounded-lg bg-black py-24 text-blue-50 sm:overflow-hidden">
        <div className="absolute top-0 -left-20 hidden h-full w-72 overflow-hidden sm:block lg:left-20 lg:w-96">
          <ImageClipBox
            src="img/contact-1.webp"
            clipClass="contact-clip-path-1 absolute top-0"
          />
          <ImageClipBox
            src="img/contact-2.webp"
            clipClass="contact-clip-path-2 absolute top-auto bottom-[-40px] lg:bottom-[-50px] lg:top-auto"
          />
        </div>

        <div className="absolute -top-40 left-20 w-60 sm:top-1/2 md:right-10 md:left-auto lg:top-20 lg:w-80">
          <ImageClipBox
            src="img/swordman-partial.webp"
            clipClass="absolute md:scale-125"
          />
          <ImageClipBox
            src="img/swordman.webp"
            clipClass="sword-man-clip-path md:scale-125"
          />
        </div>

        <div className="flex flex-col items-center text-center">
          <p className="font-general mb-10 text-[10px] uppercase">
            Join the Community
          </p>

          <AnimatedTitle
            title="Ready to D<b>o</b>minate? <br /> Join VRivals Arena T<b>o</b>day."
            containerClass="special-font !md:text-[6.2rem] w-full font-zentry !text-5xl !font-black !leading-[.9]"
          />

          <Button
            title={user ? "Go to Profile" : "Sign Up Now"}
            containerClass="mt-10 cursor-pointer"
            href={user ? "/profile" : `/login?redirect=${pathname}`}
          />
        </div>
      </div>
    </div>
  );
};

export default Contact;
