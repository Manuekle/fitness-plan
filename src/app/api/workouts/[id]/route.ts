import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  // if (!params || !params.id) {
  //   return NextResponse.json({ error: "ID no proporcionado" }, { status: 400 });
  // }

  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const workout = await prisma.workout.findUnique({
      where: { id: params.id, userId: session.user.id },
      include: {
        exercises: {
          select: {
            id: true,
            sets: true,
            reps: true,
            weight: true,
            restTime: true,
            order: true,
            notes: true,
            exercise: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!workout) {
      return NextResponse.json(
        { error: "Workout no encontrado" },
        { status: 404 }
      );
    }

    // Formatear el plan de entrenamiento para la respuesta
    const formattedWorkout = {
      id: workout.id,
      name: workout.name,
      description: workout.description,
      days: formatWorkoutPlan(workout.exercises),
      type: workout.type,
      methodology: workout.methodology,
      goal: workout.goal,
    };

    return NextResponse.json(formattedWorkout);
  } catch (error) {
    console.error("Error obteniendo workout:", error);
    return NextResponse.json(
      { error: "Error en el servidor" },
      { status: 500 }
    );
  }
}

// Format workout plan for response
function formatWorkoutPlan(workoutExercises) {
  // Agrupar ejercicios por grupo muscular
  const exercisesByDay = workoutExercises.reduce((acc, ex) => {
    // Extraer el grupo muscular del campo notes
    const muscleGroupMatch = ex.notes?.match(/^([^-]+)/);
    const muscleGroup = muscleGroupMatch
      ? muscleGroupMatch[1].trim()
      : "General";

    if (!acc[muscleGroup]) acc[muscleGroup] = [];
    acc[muscleGroup].push(ex);
    return acc;
  }, {});

  // Formatear cada grupo muscular
  return Object.entries(exercisesByDay).map(([muscleGroup, exercises]) => {
    return {
      day: muscleGroup, // Usamos el grupo muscular como identificador del día
      exercises: exercises.map((ex) => ({
        id: ex.id,
        name: ex.exercise.name || "Ejercicio",
        sets: ex.sets,
        reps: ex.reps,
        restTime: ex.restTime,
        notes: ex.notes?.replace(/^[^-]+ - /, "") || "",
      })),
    };
  });
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  try {
    const body = await req.json();
    const { name, description, exercises } = body;

    if (!name || exercises?.length === 0) {
      return NextResponse.json(
        { error: "Nombre y ejercicios requeridos" },
        { status: 400 }
      );
    }

    const workout = await prisma.workout.update({
      where: { id: params.id, userId: session.user.id },
      data: {
        name,
        description,
        exercises: {
          deleteMany: {}, // Eliminar ejercicios previos
          create: exercises.map(
            (exercise: {
              id: string;
              sets: number;
              reps: number;
              weight: number;
              restTime: number;
              order: number;
            }) => ({
              exerciseId: exercise.id,
              sets: exercise.sets,
              reps: exercise.reps,
              weight: exercise.weight,
              restTime: exercise.restTime,
              order: exercise.order,
            })
          ),
        },
      },
    });

    return NextResponse.json(workout);
  } catch (error) {
    console.error("Error actualizando workout:", error);
    return NextResponse.json(
      { error: "Error actualizando workout" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  try {
    await prisma.workout.delete({
      where: { id: params.id, userId: session.user.id },
    });
    return NextResponse.json({ message: "Workout eliminado" });
  } catch (error) {
    console.error("Error eliminando workout:", error);
    return NextResponse.json(
      { error: "Error eliminando workout" },
      { status: 500 }
    );
  }
}
