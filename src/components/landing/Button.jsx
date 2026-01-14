"use client";
import clsx from "clsx";

import Link from "next/link";

const Button = ({
  id,
  title,
  rightIcon,
  leftIcon,
  containerClass,
  onClick,
  href,
}) => {
  const content = (
    <>
      {leftIcon}

      <span className="font-general relative inline-flex overflow-hidden text-xs uppercase">
        <div className="translate-y-0 skew-y-0 transition duration-500 group-hover:translate-y-[-160%] group-hover:skew-y-12">
          {title}
        </div>
        <div className="absolute translate-y-[164%] skew-y-12 transition duration-500 group-hover:translate-y-0 group-hover:skew-y-0">
          {title}
        </div>
      </span>

      {rightIcon}
    </>
  );

  const className = clsx(
    "group relative z-10 w-fit cursor-pointer overflow-hidden rounded-full bg-white px-7 py-3 text-black",
    containerClass,
  );

  if (href) {
    return (
      <Link id={id} href={href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button id={id} className={className} onClick={onClick}>
      {content}
    </button>
  );
};

export default Button;
