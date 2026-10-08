import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { PlayLog, BoardGame, Member } from "../../types";

interface SortablePlayLogItemProps {
  id: string;
  log: PlayLog;
  index: number;
  boardGames: BoardGame[];
  members: Member[];
}

export default function SortablePlayLogItem({
  id,
  log,
  index,
  boardGames,
  members,
}: SortablePlayLogItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : "auto",
    opacity: isDragging ? 0.8 : 1,
  };

  const selectedGame = boardGames.find((g) => g.id === log.gameId);
  const gameName = selectedGame?.name || "선택되지 않은 게임";
  const participantCount = (log.participatingMembers || members.map(x => x.id)).length;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`sortable-play-log-item ${isDragging ? "dragging" : ""}`}
    >
      <button
        type="button"
        className="drag-handle"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={18} />
      </button>
      
      <div className="sortable-item-content">
        <span className="log-num">GAME {index + 1}</span>
        <span className="game-name">{gameName}</span>
        <span className="participant-info">({participantCount}명 참여)</span>
      </div>
    </div>
  );
}
