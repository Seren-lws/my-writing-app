const notes = [
  {
    id: 1,
    title: "The rain scene",
    body: "She stood at the window watching the rain trace paths down the glass — each drop choosing a different route, none of them wrong.",
    tag: "scene",
  },
  {
    id: 2,
    title: "Character idea: the cartographer",
    body: "A woman who draws maps of places she's never been. Her most famous map is of a city that doesn't exist — until someone finds it.",
    tag: "character",
  },
  {
    id: 3,
    title: "Opening line",
    body: "The last honest man in the city worked in the lost-and-found department.",
    tag: "line",
  },
];

const tagColors: Record<string, string> = {
  scene: "bg-blue-100 text-blue-600",
  character: "bg-purple-100 text-purple-600",
  line: "bg-green-100 text-green-600",
};

export default function InspirationsPage() {
  return (
    <div className="max-w-2xl mx-auto px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-semibold text-stone-800">Inspirations</h2>
          <p className="text-sm text-stone-400 mt-0.5">Collected ideas and sparks</p>
        </div>
        <button className="px-4 py-2 text-sm bg-amber-400 hover:bg-amber-500 text-white rounded-lg transition-colors">
          + New note
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {notes.map((note) => (
          <div
            key={note.id}
            className="p-5 bg-white rounded-2xl border border-stone-200 hover:border-amber-300 transition-colors cursor-pointer"
          >
            <div className="flex items-start justify-between gap-4 mb-2">
              <h3 className="font-medium text-stone-800">{note.title}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${tagColors[note.tag]}`}>
                {note.tag}
              </span>
            </div>
            <p className="text-sm text-stone-500 leading-relaxed">{note.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
