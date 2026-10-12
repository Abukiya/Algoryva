import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AuthFrame } from "./AuthFrame";

const navOf = (html: string) => html.slice(html.indexOf('<nav aria-label="Site"'), html.indexOf("</nav>"));

describe("AuthFrame (auth pages match the landing page)", () => {
  it("uses the landing header: the site nav, Roadmap and Problems links, and the theme toggle", () => {
    const html = renderToString(<AuthFrame title="Welcome back"><p>Form</p></AuthFrame>);
    expect(html).toContain('<header');
    expect(navOf(html)).toContain('href="/roadmap"');
    expect(navOf(html)).toContain('href="/problems"');
    expect(navOf(html)).toContain('aria-label="Switch to dark theme"');
  });

  it("renders the landing-style display headline, the live-topic chip and the landing graph", () => {
    const html = renderToString(<AuthFrame title="Create your account" lead="Free."><p>Form</p></AuthFrame>);
    expect(html).toContain('<h1 class="display');
    expect(html).toContain("Create your account");
    expect(html).toContain("topics live");
    expect(html).toContain("Every topic knows what it needs.");
    expect(html).toContain("Part of the curriculum as a graph");
    expect(html).not.toContain("lessons, in order");
  });

  it("keeps the page's form and footer inside the frame", () => {
    const html = renderToString(<AuthFrame title="Welcome back" footer={<a href="/x">Footer link</a>}><p>Form slot</p></AuthFrame>);
    expect(html).toContain("Form slot");
    expect(html).toContain("Footer link");
  });

  it("on the log-in page, offers Sign up but not Log in in the header", () => {
    const nav = navOf(renderToString(<AuthFrame current="login" title="Welcome back"><p>Form</p></AuthFrame>));
    expect(nav).toContain('href="/register"');
    expect(nav).not.toContain('href="/login"');
  });

  it("on the sign-up page, offers Log in but not Sign up in the header", () => {
    const nav = navOf(renderToString(<AuthFrame current="register" title="Create your account"><p>Form</p></AuthFrame>));
    expect(nav).toContain('href="/login"');
    expect(nav).not.toContain('href="/register"');
  });

  it("on other auth pages, shows both buttons like the logged-out landing page", () => {
    const nav = navOf(renderToString(<AuthFrame title="Reset your password"><p>Form</p></AuthFrame>));
    expect(nav).toContain('href="/login"');
    expect(nav).toContain('href="/register"');
  });
});
