import { Extras, activityTitles } from "./Extras";
import { Mystery } from "./Mystery";
import { Diary } from "./Diary";
import { Companion } from "./Companion";
import { Post } from "./Post";
import { Modal } from "./App";
import type { State } from "./store";
export function Activities({
  panel,
  onClose,
  state,
  update,
  notify,
}: {
  panel: string;
  state: State;
  update: (f: (s: State) => State) => void;
  onClose: () => void;
  notify: (s: string) => void;
}) {
  if (panel === "case")
    return (
      <Modal title="The case files" onClose={onClose} wide>
        <Mystery state={state} update={update} notify={notify} />
      </Modal>
    );
  if (panel === "diary")
    return (
      <Modal title="Elena’s Diary" onClose={onClose} wide>
        <Diary state={state} update={update} notify={notify} />
      </Modal>
    );
  if (panel === "pet")
    return (
      <Modal title="A little companion" onClose={onClose}>
        <Companion state={state} update={update} notify={notify} />
      </Modal>
    );
  if (panel === "post" || panel === "profiles")
    return (
      <Modal title="Owl Post" onClose={onClose} wide>
        <Post
          state={state}
          update={update}
          notify={notify}
          profiles={panel === "profiles"}
        />
      </Modal>
    );
  return (
    <Modal
      title={activityTitles[panel] || "A little discovery"}
      onClose={onClose}
      wide
    >
      <Extras panel={panel} state={state} update={update} notify={notify} />
    </Modal>
  );
}
