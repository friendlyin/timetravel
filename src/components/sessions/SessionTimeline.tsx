'use client';

import { useMemo } from 'react';

import { useSessionData } from '@/hooks/useSessionData';
import type { SessionHistoryController } from '@/hooks/useSessionHistory';
import type { Lifeline } from '@/types/lifeline.types';
import type { PivotalMoment } from '@/types/pivotalMoment.types';
import type { UserChoice } from '@/types/session.types';

type SessionTimelineProps = {
  sessionHistory: SessionHistoryController;
};

type TimelineEntry =
  | { type: 'lifeline'; lifeline: Lifeline }
  | { type: 'pivotalMoment'; moment: PivotalMoment };

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat('en', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export function SessionTimeline({ sessionHistory }: SessionTimelineProps) {
  const { sessions, selectedSessionId, isHydrated } = sessionHistory;

  const activeSession = useMemo(
    () => sessions.find((session) => session.id === selectedSessionId) ?? null,
    [selectedSessionId, sessions],
  );

  const sessionDataId = activeSession?.sessionDataId ?? null;

  const { data, isLoading, error, refresh, lastUpdatedAt } = useSessionData(
    sessionDataId,
  );

  const selectedChoices = useMemo(() => {
    if (!data) {
      return new Map<string, UserChoice>();
    }
    return data.choices.reduce((map, choice) => {
      map.set(choice.pivotalMomentId, choice);
      return map;
    }, new Map<string, UserChoice>());
  }, [data]);

  const timelineEntries = useMemo<TimelineEntry[]>(() => {
    if (!data) {
      return [];
    }

    const entries: TimelineEntry[] = [];

    for (let index = 0; index < data.lifelines.length; index += 1) {
      const lifeline = data.lifelines[index];
      entries.push({ type: 'lifeline', lifeline });

      const moment = data.pivotalMoments[index];
      if (moment) {
        entries.push({ type: 'pivotalMoment', moment });
      }
    }

    // Append any remaining pivotal moments (in case arrays are misaligned)
    if (data.pivotalMoments.length > data.lifelines.length) {
      for (let index = data.lifelines.length; index < data.pivotalMoments.length; index += 1) {
        const moment = data.pivotalMoments[index];
        entries.push({ type: 'pivotalMoment', moment });
      }
    }

    return entries;
  }, [data]);

  const sessionSummary = useMemo(() => {
    if (!data) {
      return null;
    }

    return {
      location: data.input.location,
      date: data.input.date,
      persona: data.selectedPersona?.title ?? 'Not selected',
      startTime: DATE_TIME_FORMATTER.format(new Date(data.metadata.startTime)),
      endTime: data.metadata.endTime
        ? DATE_TIME_FORMATTER.format(new Date(data.metadata.endTime))
        : null,
      status: data.metadata.status,
      lifelineCount: data.lifelines.length,
      pivotalMomentCount: data.pivotalMoments.length,
      choiceCount: data.choices.length,
      currentAge: data.gameState.currentAge,
    };
  }, [data]);

  const lastUpdatedLabel = lastUpdatedAt
    ? DATE_TIME_FORMATTER.format(new Date(lastUpdatedAt))
    : null;

  return (
    <section className="flex w-full max-w-5xl flex-col gap-5 rounded-xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
      <header className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Timeline Overview
            </span>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {activeSession?.label ?? 'No session selected'}
            </h2>
          </div>
          <button
            type="button"
            onClick={refresh}
            disabled={!sessionDataId || isLoading}
            className={[
              'rounded-md border px-3 py-1.5 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-slate-900',
              !sessionDataId
                ? 'cursor-not-allowed border-slate-200 bg-white text-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-600'
                : isLoading
                  ? 'border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-500'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800'
            ].join(' ')}
          >
            Refresh
          </button>
        </div>
        {lastUpdatedLabel && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Last updated {lastUpdatedLabel}
          </p>
        )}
      </header>

      {!isHydrated ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Loading sessions…
        </p>
      ) : !activeSession ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Select a session from the sidebar to view its timeline.
        </p>
      ) : !sessionDataId ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Use <span className="font-semibold text-slate-700 dark:text-slate-200">Start a New Journey</span> to generate this character&apos;s history.
        </p>
      ) : error ? (
        <div className="flex flex-col gap-2 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
          <span>Failed to load session timeline: {error}</span>
          <button
            type="button"
            onClick={refresh}
            className="self-start rounded-md border border-rose-300 px-2 py-1 text-xs font-semibold text-rose-700 transition hover:border-rose-400 hover:bg-rose-100 dark:border-rose-700 dark:text-rose-200 dark:hover:border-rose-500 dark:hover:bg-rose-900/40"
          >
            Retry
          </button>
        </div>
      ) : isLoading && !data ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Loading timeline data…
        </p>
      ) : !data ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Session data is unavailable or has been removed.
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {sessionSummary && (
            <div className="grid grid-cols-1 gap-4 rounded-lg border border-slate-100 bg-slate-50/60 p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300 md:grid-cols-2 xl:grid-cols-4">
              <Stat label="Location" value={sessionSummary.location} />
              <Stat label="Date" value={sessionSummary.date} />
              <Stat label="Persona" value={sessionSummary.persona} />
              <Stat
                label="Status"
                value={`${sessionSummary.status}${sessionSummary.currentAge !== undefined ? ` · Age ${sessionSummary.currentAge}` : ''}`}
              />
              <Stat
                label="Lifeline Segments"
                value={String(sessionSummary.lifelineCount)}
              />
              <Stat
                label="Pivotal Moments"
                value={String(sessionSummary.pivotalMomentCount)}
              />
              <Stat label="Choices Made" value={String(sessionSummary.choiceCount)} />
              <Stat
                label="Session Start"
                value={sessionSummary.startTime}
              />
              {sessionSummary.endTime && (
                <Stat label="Session End" value={sessionSummary.endTime} />
              )}
            </div>
          )}

          {data.historicalContext && (
            <ContextCard
              title="Historical Context"
              description={data.historicalContext.description}
              meta={{
                country: data.historicalContext.country,
                rulers: data.historicalContext.politicalSituation?.rulers?.join(', '),
                economy: data.historicalContext.economy,
              }}
            />
          )}

          {data.personaOptions && data.personaOptions.options.length > 0 && (
            <div className="flex flex-col gap-3">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Persona Options
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {data.personaOptions.options.map((option) => (
                  <div
                    key={option.id}
                    className={[
                      'flex flex-col gap-2 rounded-lg border p-4 text-sm transition',
                      option.id === data.selectedPersona?.id
                        ? 'border-sky-300 bg-sky-50/70 shadow-sm dark:border-sky-600 dark:bg-sky-900/40'
                        : 'border-slate-200 bg-white/80 dark:border-slate-800 dark:bg-slate-900/50'
                    ].join(' ')}
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {option.title}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {option.probability}% chance
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      {option.summary}
                    </p>
                    <div className="grid grid-cols-1 gap-1 text-xs text-slate-500 dark:text-slate-400">
                      <span>
                        Class: {option.familyBackground.socialClass}
                      </span>
                      <span>
                        Occupation: {option.familyBackground.occupation}
                      </span>
                      <span>Wealth: {option.familyBackground.wealth}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 text-[0.65rem] text-slate-500 dark:text-slate-400">
                      {option.opportunities.map((item) => (
                        <span key={item} className="rounded bg-slate-200 px-2 py-[2px] dark:bg-slate-800">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-6">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Life Progression
            </h3>
            {timelineEntries.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No lifeline data generated yet.
              </p>
            ) : (
              <div className="relative">
                <div className="absolute left-4 top-2 bottom-2 w-px bg-slate-200 dark:bg-slate-700" aria-hidden />
                <ul className="space-y-6">
                  {timelineEntries.map((entry, index) => (
                    <li key={`${entry.type}-${index}`} className="relative pl-10">
                      <span
                        className="absolute left-2 top-3 h-3 w-3 -translate-x-1/2 rounded-full border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
                        aria-hidden
                      />
                      {entry.type === 'lifeline' ? (
                        <LifelineCard lifeline={entry.lifeline} />
                      ) : (
                        <PivotalMomentCard
                          moment={entry.moment}
                          selectedChoice={selectedChoices.get(entry.moment.id) ?? null}
                        />
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

type StatProps = {
  label: string;
  value: string;
};

function Stat({ label, value }: StatProps) {
  return (
    <div className="flex flex-col">
      <span className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-500">
        {label}
      </span>
      <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
        {value}
      </span>
    </div>
  );
}

type ContextCardProps = {
  title: string;
  description: string;
  meta: Record<string, string | undefined>;
};

function ContextCard({ title, description, meta }: ContextCardProps) {
  return (
    <article className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white/90 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          {title}
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line">
          {description}
        </p>
      </div>
      <dl className="grid grid-cols-1 gap-2 text-xs text-slate-500 dark:text-slate-400 md:grid-cols-3">
        {Object.entries(meta)
          .filter(([, value]) => Boolean(value))
          .map(([key, value]) => (
            <div key={key} className="flex flex-col">
              <dt className="uppercase tracking-wide">
                {key}
              </dt>
              <dd className="text-slate-600 dark:text-slate-300">{value}</dd>
            </div>
          ))}
      </dl>
    </article>
  );
}

type LifelineCardProps = {
  lifeline: Lifeline;
};

function LifelineCard({ lifeline }: LifelineCardProps) {
  const firstEventYear = lifeline.events[0]?.year;
  const lastEventYear = lifeline.events[lifeline.events.length - 1]?.year;
  const yearRangeLabel = firstEventYear
    ? lastEventYear && lastEventYear !== firstEventYear
      ? `${firstEventYear} – ${lastEventYear}`
      : firstEventYear
    : null;

  return (
    <article className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white/90 p-4 shadow-sm transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-slate-600">
      <header className="flex flex-col gap-1">
        <span className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Lifeline Segment
        </span>
        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Ages {lifeline.startAge} – {lifeline.endAge}
        </h4>
        {yearRangeLabel && (
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {yearRangeLabel}
          </span>
        )}
      </header>
      <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line">
        {lifeline.narrative}
      </p>
      {lifeline.events.length > 0 && (
        <div className="flex flex-col gap-2">
          <h5 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Key Events
          </h5>
          <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
            {lifeline.events.map((event) => (
              <li key={`${event.age}-${event.year}`}
                className="rounded-lg border border-slate-100 bg-slate-50/70 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900/40"
              >
                <div className="flex items-center justify-between text-[0.7rem] text-slate-500 dark:text-slate-400">
                  <span>Age {event.age}</span>
                  <span>{event.year}</span>
                </div>
                <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">
                  {event.event}
                </p>
                <div className="mt-1 flex items-center justify-between text-[0.65rem] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  <span>Impact: {event.impact}</span>
                  <span>{event.location}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="grid grid-cols-1 gap-3 text-xs text-slate-500 dark:text-slate-400 md:grid-cols-2">
        <DetailList label="Skills" items={lifeline.characterDevelopment.skills} />
        <DetailList label="Relationships" items={lifeline.characterDevelopment.relationships} />
        <DetailList label="Beliefs" items={lifeline.characterDevelopment.beliefs} />
        <div className="flex flex-col">
          <span className="font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Status
          </span>
          <span>Reputation: {lifeline.characterDevelopment.reputation}</span>
          <span>Physical: {lifeline.characterDevelopment.physicalCondition}</span>
          <span>Mental: {lifeline.characterDevelopment.mentalState}</span>
        </div>
      </div>
    </article>
  );
}

type PivotalMomentCardProps = {
  moment: PivotalMoment;
  selectedChoice: UserChoice | null;
};

function PivotalMomentCard({ moment, selectedChoice }: PivotalMomentCardProps) {
  return (
    <article className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-slate-600">
      <header className="flex flex-col gap-1">
        <span className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Pivotal Moment · Age {moment.age} · {moment.year}
        </span>
        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {moment.title}
        </h4>
        <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line">
          {moment.situation}
        </p>
      </header>
      <div className="grid grid-cols-1 gap-3 text-xs text-slate-500 dark:text-slate-400 md:grid-cols-2">
        <div className="flex flex-col gap-1">
          <span className="font-semibold uppercase tracking-wide">
            Context
          </span>
          <span>{moment.context}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="font-semibold uppercase tracking-wide">
            Stakes
          </span>
          <span>{moment.stakes}</span>
        </div>
        {moment.timeConstraint && (
          <div className="flex flex-col gap-1">
            <span className="font-semibold uppercase tracking-wide">
              Time Constraint
            </span>
            <span>{moment.timeConstraint}</span>
          </div>
        )}
        {moment.characterDied && (
          <div className="flex flex-col gap-1 text-rose-600 dark:text-rose-400">
            <span className="font-semibold uppercase tracking-wide">
              Outcome
            </span>
            <span>The character died at this moment.</span>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <h5 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Choices
        </h5>
        <ul className="space-y-2">
          {moment.choices.map((choice) => {
            const isSelected = selectedChoice?.choiceId === choice.id;
            return (
              <li
                key={choice.id}
                className={[
                  'rounded-lg border px-3 py-2 text-sm transition',
                  isSelected
                    ? 'border-sky-300 bg-sky-50/70 shadow-sm dark:border-sky-600 dark:bg-sky-900/40'
                    : 'border-slate-200 bg-white/80 dark:border-slate-700 dark:bg-slate-900/40'
                ].join(' ')}
              >
                <div className="flex items-center justify-between text-sm font-semibold text-slate-900 dark:text-slate-100">
                  <span>{choice.title}</span>
                  <span className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Risk: {choice.risk}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  {choice.description}
                </p>
                <div className="mt-2 grid grid-cols-1 gap-1 text-xs text-slate-500 dark:text-slate-400 md:grid-cols-2">
                  <ChoiceDetail label="Immediate Consequences" items={choice.immediateConsequences} />
                  <ChoiceDetail label="Potential Outcomes" items={choice.potentialOutcomes} />
                </div>
                {choice.alignment.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1 text-[0.65rem] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {choice.alignment.map((tag) => (
                      <span key={tag} className="rounded bg-slate-200 px-2 py-[2px] dark:bg-slate-800">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                {isSelected && selectedChoice?.choiceTitle && (
                  <p className="mt-2 text-xs font-semibold text-sky-700 dark:text-sky-300">
                    Selected: {selectedChoice.choiceTitle}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </div>
      {moment.influencingFactors.length > 0 && (
        <div className="flex flex-col gap-1 text-xs text-slate-500 dark:text-slate-400">
          <span className="font-semibold uppercase tracking-wide">
            Influencing Factors
          </span>
          <ul className="flex flex-wrap gap-2">
            {moment.influencingFactors.map((factor) => (
              <li key={factor} className="rounded bg-slate-200 px-2 py-[2px] text-[0.65rem] uppercase tracking-wide dark:bg-slate-800">
                {factor}
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}

type DetailListProps = {
  label: string;
  items: string[];
};

function DetailList({ label, items }: DetailListProps) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col">
      <span className="font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </span>
      <ul className="mt-1 space-y-1 text-slate-600 dark:text-slate-300">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

type ChoiceDetailProps = {
  label: string;
  items: string[];
};

function ChoiceDetail({ label, items }: ChoiceDetailProps) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col">
      <span className="font-semibold uppercase tracking-wide">
        {label}
      </span>
      <ul className="mt-1 space-y-1">
        {items.map((item) => (
          <li key={item} className="text-slate-600 dark:text-slate-300">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
