import { HashRouter, Route, Routes } from "react-router-dom";
import { ArchiveView } from "./components/ArchiveView";
import { FinishedView } from "./components/FinishedView";
import { Front } from "./components/Front";
import { SavedView } from "./components/SavedView";
import { SearchView } from "./components/SearchView";
import { SectionView } from "./components/SectionView";
import { Shell } from "./components/Shell";
import { StoryView } from "./components/StoryView";
import { DoseProvider } from "./dose";

export default function App() {
  return (
    <HashRouter>
      <DoseProvider>
        <Routes>
          <Route element={<Shell />}>
            <Route path="/" element={<Front />} />
            <Route path="/issue/:date" element={<Front />} />
            <Route path="/memes" element={<SectionView which="memes" />} />
            <Route path="/places" element={<SectionView which="places" />} />
            <Route path="/things" element={<SectionView which="things" />} />
            <Route path="/gems" element={<SectionView which="gems" />} />
            <Route path="/issue/:date/memes" element={<SectionView which="memes" />} />
            <Route path="/issue/:date/places" element={<SectionView which="places" />} />
            <Route path="/issue/:date/things" element={<SectionView which="things" />} />
            <Route path="/issue/:date/gems" element={<SectionView which="gems" />} />
            <Route path="/saved" element={<SavedView />} />
            <Route path="/archive" element={<ArchiveView />} />
            <Route path="/search" element={<SearchView />} />
            <Route path="/story/:id" element={<StoryView />} />
            <Route path="/finished" element={<FinishedView />} />
            <Route path="*" element={<Front />} />
          </Route>
        </Routes>
      </DoseProvider>
    </HashRouter>
  );
}
