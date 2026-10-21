import { describe, it, expect } from 'vitest';
import {
    sortByNewest,
    formatPostedDate,
    getDepartments,
    getLocations,
    filterJobs,
    parseFilterParams,
    buildFilterParams,
} from './jobs';
import type { Job } from '../types/job';

function makeJob(slug: string, postedDate: string): Job {
    return {
        slug,
        title: `Role ${slug}`,
        department: 'Technology',
        location: 'Remote',
        type: 'Full-time',
        remote: true,
        postedDate,
        summary: 'A role.',
    };
}

describe('sortByNewest', () => {
    it('orders jobs by posted date, newest first', () => {
        const jobs = [
            makeJob('a', '2027-01-01'),
            makeJob('b', '2027-03-15'),
            makeJob('c', '2027-02-10'),
        ];
        expect(sortByNewest(jobs).map((j) => j.slug)).toEqual(['b', 'c', 'a']);
    });

    it('does not mutate the input array', () => {
        const jobs = [makeJob('a', '2027-01-01'), makeJob('b', '2027-03-15')];
        const original = jobs.map((j) => j.slug);
        sortByNewest(jobs);
        expect(jobs.map((j) => j.slug)).toEqual(original);
    });
});

describe('formatPostedDate', () => {
    it('formats an ISO date as a readable string', () => {
        expect(formatPostedDate('2027-01-05')).toBe('January 5, 2027');
    });

    it('returns the raw value when the date is unparseable', () => {
        expect(formatPostedDate('not-a-date')).toBe('not-a-date');
    });
});

function makeFilterJob(slug: string, department: string, location: string): Job {
    return { ...makeJob(slug, '2027-01-01'), department, location };
}

const filterJobsFixture: Job[] = [
    makeFilterJob('a', 'Technology', 'Vancouver, Canada'),
    makeFilterJob('b', 'Finance', 'Woodinville, WA, USA'),
    makeFilterJob('c', 'Security', 'Vancouver, Canada'),
    makeFilterJob('d', 'Technology', 'Helsinki, Finland'),
];

describe('getDepartments / getLocations', () => {
    it('returns unique values sorted alphabetically', () => {
        expect(getDepartments(filterJobsFixture)).toEqual(['Finance', 'Security', 'Technology']);
        expect(getLocations(filterJobsFixture)).toEqual([
            'Helsinki, Finland',
            'Vancouver, Canada',
            'Woodinville, WA, USA',
        ]);
    });

    it('returns empty arrays for no jobs', () => {
        expect(getDepartments([])).toEqual([]);
        expect(getLocations([])).toEqual([]);
    });
});

describe('filterJobs', () => {
    const slugs = (jobs: Job[]): string[] => jobs.map((job) => job.slug);

    it('returns all jobs when no filters are selected (reset)', () => {
        const result = filterJobs(filterJobsFixture, { departments: [], locations: [] });
        expect(slugs(result)).toEqual(['a', 'b', 'c', 'd']);
        expect(result).not.toBe(filterJobsFixture);
    });

    it('filters by department only', () => {
        const result = filterJobs(filterJobsFixture, { departments: ['Technology'], locations: [] });
        expect(slugs(result)).toEqual(['a', 'd']);
    });

    it('filters by location only', () => {
        const result = filterJobs(filterJobsFixture, {
            departments: [],
            locations: ['Vancouver, Canada'],
        });
        expect(slugs(result)).toEqual(['a', 'c']);
    });

    it('matches any selected value within a filter', () => {
        const result = filterJobs(filterJobsFixture, {
            departments: ['Finance', 'Security'],
            locations: [],
        });
        expect(slugs(result)).toEqual(['b', 'c']);
    });

    it('matches either filter when both are selected', () => {
        const result = filterJobs(filterJobsFixture, {
            departments: ['Finance'],
            locations: ['Helsinki, Finland'],
        });
        expect(slugs(result)).toEqual(['b', 'd']);
    });

    it('returns an empty list when nothing matches', () => {
        expect(filterJobs(filterJobsFixture, { departments: ['Legal'], locations: [] })).toEqual([]);
    });

    it('does not mutate the input array', () => {
        const input = [...filterJobsFixture];
        filterJobs(input, { departments: ['Finance'], locations: [] });
        expect(input).toEqual(filterJobsFixture);
    });
});

describe('filter query params', () => {
    it('round-trips criteria, including values with special characters', () => {
        const criteria = {
            departments: ['Manufacturing & Field Service', 'Finance'],
            locations: ['Remote (US & Canada)'],
        };
        expect(parseFilterParams(buildFilterParams(criteria))).toEqual(criteria);
    });

    it('treats missing or empty params as inactive filters', () => {
        expect(parseFilterParams(new URLSearchParams('department=&foo=bar'))).toEqual({
            departments: [],
            locations: [],
        });
        expect(buildFilterParams({ departments: [], locations: [] }).toString()).toBe('');
    });
});
