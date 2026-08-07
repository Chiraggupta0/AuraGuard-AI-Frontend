export default function VideoPlayer({ src, poster, title = 'Video stream' }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-black">
      <video className="aspect-video w-full object-cover" src={src} poster={poster} controls title={title} />
    </div>
  );
}
