import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useDose } from "../dose";
import { coverStory, issueNo } from "../magazine";
import { cardThumb } from "../media";

export function ArchiveView() {
  const { index, edition } = useDose();
  useEffect(() => {
    document.title = "Archive — Daily Dose";
    return () => { document.title = "Daily Dose"; };
  }, []);
  if (!index) return null;
  const days = [...index.days].sort((a, b) => b.date.localeCompare(a.date));
  const cover = edition ? coverStory(edition.items) : undefined;
  const thumb = cover ? cardThumb(cover) : null;
  return (
    <article className="archive">
      <p className="kicker">The shelf</p>
      <h1>Archive</h1>
      <p className="dek">Past editions, kept as covers.</p>
      <div className="covers">
        {days.map((day) => (
          <Link key={day.date} className="issue-cover" to={`/issue/${day.date}`}>
            {day.date === edition?.date && thumb && <img src={thumb} alt="" width={600} height={800} loading="lazy" decoding="async" />}
            <span className="issue-cover-copy">
              <span className="wordmark">Daily Dose</span>
              <span>
                <strong>No. {issueNo(index, day.date)}</strong>
                <em>{day.updated}</em>
                <em>{day.count} stories · Riyadh</em>
              </span>
            </span>
          </Link>
        ))}
      </div>
    </article>
  );
}
