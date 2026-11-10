import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useDose } from "../dose";
import { issueNo } from "../magazine";

export function FinishedView() {
  const { personal, index } = useDose();
  useEffect(() => {
    document.title = "Today's issue — Daily Dose";
    return () => { document.title = "Daily Dose"; };
  }, []);
  const days = index ? [...index.days].sort((a, b) => b.date.localeCompare(a.date)) : [];
  return (
    <article className="finished">
      <p className="kicker">The close</p>
      <h1>You've finished today's issue</h1>
      <p className="dek">
        {personal.streak.count > 0 ? `${personal.streak.count}-day streak on this device.` : "The streak starts when you come back tomorrow."}
      </p>
      <p className="text-links"><Link to="/">Read it again</Link><Link to="/archive">Archive</Link></p>
      {days.length > 0 && (
        <div className="covers finished-covers">
          {days.map((day) => (
            <Link key={day.date} className="issue-cover" to={`/issue/${day.date}`}>
              <span className="issue-cover-copy">
                <span className="wordmark">Daily Dose</span>
                <span>
                  <strong>No. {index ? issueNo(index, day.date) : "01"}</strong>
                  <em>{day.updated}</em>
                  <em>{day.count} stories · Riyadh</em>
                </span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </article>
  );
}
