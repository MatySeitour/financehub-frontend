import { getCurrentStep } from "@renderer/hooks/user";
import { cn, getErrorMessage } from "@renderer/utils";
import { ServerError } from "@renderer/utils/types";
import {
  Building2Icon,
  CheckIcon,
  ChevronRightIcon,
  CircleAlertIcon,
  HomeIcon,
  ShieldUserIcon,
  UsersRoundIcon,
} from "lucide-react";
import { useState } from "react";
import { useQuery } from "react-query";
import { StepOne, StepThree, StepTwo } from "../onboarding";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "../Button";
import { Link, useNavigate } from "react-router";

const allSteps = [
  {
    step: 1,
    name: "Mi organización",
    description: "Dale identidad a tu organización",
    icon: Building2Icon,
  },
  {
    step: 2,
    name: "Usuario administrador",
    description: "Modifica los datos del usuario dueño de la organización",
    icon: ShieldUserIcon,
  },
  {
    step: 3,
    name: "Integrantes",
    description: "Agrega los integrantes de tu organización",
    icon: UsersRoundIcon,
  },
];

export function OnboardingPage() {
  let navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState<number>();

  const currentStepQuery = useQuery<
    Awaited<ReturnType<typeof getCurrentStep>>,
    ServerError
  >({
    queryKey: ["current-step", "all"],
    queryFn: () => getCurrentStep(),
    onSuccess: (data) => {
      setCurrentStep(data?.step ?? 1);
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  const currentStepData = currentStepQuery.data?.step ?? 0;

  const nextStep = (step: number) => {
    setCurrentStep(step);
  };

  return (
    <div className="relative flex h-screen w-full items-center">
      {currentStepQuery.isError ? (
        <div className="flex h-full w-full items-center justify-center">
          <div className="flex w-full max-w-2xl flex-col items-center justify-center gap-4">
            <CircleAlertIcon className="size-20 min-w-20 text-red-500" />
            <p className="text-lg font-medium text-red-500">
              {getErrorMessage(currentStepQuery.error)}
            </p>
            <Button onClick={() => navigate("/login")} variant="success">
              Volver al inicio
            </Button>
          </div>
        </div>
      ) : (
        <>
          <AnimatePresence>
            {currentStep !== 4 && (
              <motion.div
                exit={{
                  opacity: 0,
                  transition: { duration: 0.2, delay: 0 },
                }}
                className="relative z-10 flex h-full w-72 flex-col gap-4 bg-[#FEFEFE] shadow-md"
              >
                <div className="flex items-center py-4 pl-6 pr-4 transition-all xl:opacity-100">
                  <span className="onboarding-text text-3xl font-extrabold text-slate-200">
                    Finance
                  </span>
                  <b className="onboarding-text inline-block text-3xl font-extrabold">
                    {" "}
                    hub
                  </b>
                </div>

                {currentStepQuery.isLoading ? (
                  <ul className="flex h-full w-full flex-col items-start gap-0.5 py-4 pl-6 pr-4">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <li
                        key={index}
                        className="flex flex-col items-start gap-1"
                      >
                        <div className="flex cursor-pointer items-center gap-1">
                          <div className="relative flex size-9 min-w-9 animate-pulse items-center justify-center overflow-hidden rounded-full bg-slate-200 p-2" />

                          <span
                            className={cn(
                              "h-4 w-32 animate-pulse bg-slate-200 pl-1 text-sm font-medium",
                            )}
                          />
                        </div>

                        {index !== 3 && (
                          <span className="h-12 w-px translate-x-5 animate-pulse bg-slate-200" />
                        )}
                      </li>
                    ))}
                  </ul>
                ) : !!currentStep ? (
                  <div className="relative h-fit w-full">
                    <ChevronRightIcon
                      className={cn(
                        currentStep === 1
                          ? "top-6"
                          : currentStep === 2
                            ? "top-1/2 -translate-y-1/2"
                            : "top-52 -translate-y-0.5",
                        "absolute left-1 size-5 min-w-5 text-primary transition-all",
                      )}
                    />

                    <ul className="flex w-full flex-col items-start gap-0.5 py-4 pl-6 pr-4">
                      {allSteps.map((step) => (
                        <li
                          key={step.step}
                          className={cn(
                            currentStepData < step.step
                              ? "pointer-events-none opacity-60"
                              : "opacity-100",
                            "flex flex-col items-start gap-1",
                          )}
                        >
                          <div className="flex cursor-pointer items-center gap-1">
                            <div
                              className={cn(
                                currentStepData > step.step
                                  ? "border-primary/40 text-primary"
                                  : "border-slate-300/50 text-slate-400",
                                "relative flex size-9 min-w-9 items-center justify-center overflow-hidden rounded-full border-2 p-2",
                              )}
                            >
                              <step.icon
                                className={cn(
                                  currentStep > step.step
                                    ? "-translate-y-96"
                                    : "-translate-y-1/2",
                                  "absolute left-1/2 top-1/2 size-4 min-w-4 -translate-x-1/2 transition-all",
                                )}
                              />

                              <CheckIcon
                                className={cn(
                                  currentStep > step.step
                                    ? "-translate-y-1/2"
                                    : "translate-y-96",
                                  "absolute left-1/2 top-1/2 size-5 min-w-5 -translate-x-1/2 transition-all",
                                )}
                              />
                            </div>

                            <span
                              className={cn(
                                currentStep > step.step
                                  ? "text-primary"
                                  : "text-slate-500",
                                "pl-1 text-sm font-medium",
                              )}
                            >
                              {step.name}
                            </span>
                          </div>

                          {step.step !== 3 && (
                            <span className="h-12 w-px translate-x-5 bg-slate-300/70" />
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </motion.div>
            )}
          </AnimatePresence>

          {currentStepQuery.isLoading ? (
            <div className="flex h-full w-full items-center justify-center">
              <span className="relative inline-block h-12 w-12 animate-rotateFull rounded-[50%] border-4 border-primary border-b-primary/20 after:absolute after:left-1/2 after:top-1/2 after:h-14 after:w-14 after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-[50%] after:border-4 after:border-transparent"></span>
            </div>
          ) : (
            <div
              className={cn(
                currentStep !== 4 && "max-w-xl 2xl:max-w-3xl",
                "relative flex h-full w-full items-center overflow-hidden",
              )}
            >
              <AnimatePresence>
                {currentStep === 1 ? (
                  <StepOne
                    organization={currentStepQuery.data?.organization}
                    nextStep={nextStep}
                  />
                ) : currentStep === 2 ? (
                  currentStepQuery.data?.user && (
                    <StepTwo
                      currentStep={currentStepQuery.data.step}
                      organization={currentStepQuery.data?.organization}
                      user={currentStepQuery.data?.user}
                      nextStep={nextStep}
                    />
                  )
                ) : currentStep === 3 &&
                  currentStepQuery.data?.user &&
                  currentStepQuery.data ? (
                  <StepThree
                    session={currentStepQuery.data.user}
                    organization={currentStepQuery.data?.organization}
                    nextStep={nextStep}
                  />
                ) : (
                  <motion.div
                    animate={{
                      opacity: 1,
                      transition: { duration: 0.2, delay: 0.2 },
                    }}
                    initial={{ opacity: 0 }}
                    className="h-full w-full"
                  >
                    <div className="flex h-full w-full flex-col items-center justify-center gap-6">
                      <p className="text-4xl font-medium text-slate-600">
                        Bienvenido{" "}
                        <b className="onboarding-text inline-block">
                          {currentStepQuery.data?.organization?.name}
                        </b>
                      </p>
                      <div className="flex flex-col items-center gap-4">
                        <p className="text-xl font-medium text-slate-500">
                          Ya pódes empezar a disfrutar de nuestro servicio
                        </p>
                        <Link to={"/home"}>
                          <Button
                            className="flex items-center gap-1"
                            variant="success"
                          >
                            <HomeIcon className="size-4 min-w-4" />
                            Ir a dashboard
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </>
      )}

      <div className="absolute bottom-0 right-0 -z-10 h-full w-full bg-gradient-to-t from-primary/20 via-white" />
    </div>
  );
}
