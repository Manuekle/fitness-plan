import { useState } from "react";
import { Button } from "@/components/ui/button";
import WorkoutExercise from "../workouts/workout-exercise";
import { toast } from "sonner";
import { Delete02Icon } from "hugeicons-react";

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  restTime: number;
  notes?: string;
}

interface WorkoutNewProps {
  workoutId: string;
  exercises: Exercise[];
  days: string[];
}

export function WorkoutNew({
  workoutId,
  exercises: initialExercises,
  days,
}: WorkoutNewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [exercises, setExercises] = useState<Exercise[]>(initialExercises);

  const handleDelete = async (exerciseId: string) => {
    try {
      const res = await fetch(
        `/api/workouts/${workoutId}/exercises/${exerciseId}`,
        {
          method: "DELETE",
        }
      );

      if (res.ok) {
        setExercises((prevExercises) =>
          prevExercises.filter((ex) => ex.id !== exerciseId)
        );
        toast.success("Ejercicio eliminado", {
          description: "El ejercicio se ha eliminado correctamente",
        });
      } else {
        throw new Error("Error al eliminar el ejercicio");
      }
    } catch (error) {
      console.error("Error al eliminar el ejercicio:", error);
      toast.error("Error al eliminar el ejercicio", {
        description: "Ha ocurrido un error al intentar eliminar el ejercicio",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Button
        size="sm"
        className="text-xs"
        onClick={() => setIsModalOpen(true)}
      >
        Agregar ejercicio
      </Button>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {exercises.map((exercise) => (
          <div key={exercise.id} className="border rounded-lg shadow-sm">
            <div className="flex items-center p-4 border-b">
              <div className="flex-1">
                <h4 className="font-medium text-sm">{exercise.name}</h4>
                {exercise.notes && (
                  <p className="text-xs text-muted-foreground">
                    {exercise.notes}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={() => handleDelete(exercise.id)}
              >
                <Delete02Icon className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4 grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Series</p>
                <p className="font-semibold">{exercise.sets}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Repeticiones
                </p>
                <p className="font-semibold">{exercise.reps}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Descanso</p>
                <p className="font-semibold flex items-center justify-center gap-1">
                  {exercise.restTime}s
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {exercises.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No hay ejercicios en este entrenamiento
        </div>
      )}

      <WorkoutExercise
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        workoutId={workoutId}
        days={days}
      />
    </div>
  );
}
