import { Clock, CheckCircle2, Lock, ChevronRight } from "lucide-react";
import { LucideIcon } from "lucide-react";

export interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: string;
  icon: LucideIcon;
  completed: boolean;
  locked: boolean;
}

interface LessonCardProps {
  lesson: Lesson;
  onClick: (lesson: Lesson) => void;
}

export function LessonCard({ lesson, onClick }: LessonCardProps) {
  const Icon = lesson.icon;

  return (
    <button
      onClick={() => !lesson.locked && onClick(lesson)}
      disabled={lesson.locked}
      className={`w-full text-left bg-card rounded-xl border border-border p-5 transition-all duration-300 ${
        lesson.locked
          ? "opacity-60 cursor-not-allowed"
          : "hover:shadow-soft hover:border-primary/30 hover:-translate-y-0.5"
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
            lesson.completed
              ? "bg-success/10 text-success"
              : lesson.locked
              ? "bg-muted text-muted-foreground"
              : "bg-primary/10 text-primary"
          }`}
        >
          {lesson.completed ? (
            <CheckCircle2 className="w-6 h-6" />
          ) : lesson.locked ? (
            <Lock className="w-6 h-6" />
          ) : (
            <Icon className="w-6 h-6" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className="font-semibold text-foreground truncate">{lesson.title}</h3>
            {!lesson.locked && (
              <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            )}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
            {lesson.description}
          </p>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{lesson.duration}</span>
            {lesson.completed && (
              <span className="text-xs text-success font-medium ml-auto">Completed</span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
