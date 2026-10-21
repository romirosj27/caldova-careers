/**
 * Pure, side-effect-free helpers for working with job postings.
 *
 * These operate on plain `Job[]` arrays (already loaded from the content
 * collection by the calling page) so they can be unit tested without the Astro
 * content runtime or a database.
 */
import type { Job } from '../types/job';

/** Return jobs sorted by posted date, newest first (does not mutate input). */
export function sortByNewest(jobs: Job[]): Job[] {
    return [...jobs].sort(
        (a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime(),
    );
}

/**
 * Format an ISO-8601 date as a human-readable posted date,
 * e.g. "January 5, 2027". Falls back to the raw value if unparseable.
 */
export function formatPostedDate(iso: string): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
        return iso;
    }
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC',
    });
}

/** Selected filter values. An empty array means that filter is inactive. */
export interface RoleFilterCriteria {
    departments: string[];
    locations: string[];
}

/** Return the unique values, sorted alphabetically. */
function uniqueSorted(values: string[]): string[] {
    return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

/** Unique department names across jobs, sorted alphabetically. */
export function getDepartments(jobs: Job[]): string[] {
    return uniqueSorted(jobs.map((job) => job.department));
}

/** Unique location strings across jobs, sorted alphabetically. */
export function getLocations(jobs: Job[]): string[] {
    return uniqueSorted(jobs.map((job) => job.location));
}

/**
 * Filter jobs by selected departments and locations.
 *
 * Values within a filter are OR'd, and the two filters are OR'd with each
 * other: a job matches if it is in any selected department or any selected
 * location. A filter with no selections is inactive; with both inactive every
 * job is returned. Does not mutate the input.
 */
export function filterJobs<T extends Pick<Job, 'department' | 'location'>>(
    jobs: T[],
    criteria: RoleFilterCriteria,
): T[] {
    const { departments, locations } = criteria;
    if (departments.length === 0 && locations.length === 0) {
        return [...jobs];
    }
    return jobs.filter(
        (job) => departments.includes(job.department) || locations.includes(job.location),
    );
}

/** Read filter criteria from URL query params (`department` and `location`, repeatable). */
export function parseFilterParams(params: URLSearchParams): RoleFilterCriteria {
    return {
        departments: params.getAll('department').filter((value) => value !== ''),
        locations: params.getAll('location').filter((value) => value !== ''),
    };
}

/** Build URL query params from filter criteria; inactive filters add nothing. */
export function buildFilterParams(criteria: RoleFilterCriteria): URLSearchParams {
    const params = new URLSearchParams();
    criteria.departments.forEach((value) => params.append('department', value));
    criteria.locations.forEach((value) => params.append('location', value));
    return params;
}
