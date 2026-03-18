export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-6xl">
        Chào mừng đến với Anime Social
      </h1>
      <p className="mt-6 text-lg leading-8 text-muted-foreground">
        Nền tảng mạng xã hội chuyên biệt cho fan Anime & Manga.
      </p>
      <div className="mt-10 flex items-center justify-center gap-x-6">
        <button className="rounded-md bg-primary px-3.5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
          Bắt đầu ngay
        </button>
        <button className="text-sm font-semibold leading-6 text-foreground">
          Tìm hiểu thêm <span aria-hidden="true">→</span>
        </button>
      </div>
    </main>
  );
}
