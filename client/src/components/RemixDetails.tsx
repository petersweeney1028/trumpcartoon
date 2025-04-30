import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { Remix } from "@shared/schema";

interface RemixDetailsProps {
  remix: Remix;
}

const RemixDetails = ({ remix }: RemixDetailsProps) => {
  const formattedDate = remix.createdAt 
    ? formatDistanceToNow(new Date(remix.createdAt), { addSuffix: true })
    : "recently";

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
      <h1 className="text-2xl font-heading font-bold text-dark mb-4">
        {remix.topic}
      </h1>
      <div className="mb-4">
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>Created {formattedDate}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span>{remix.views || 0} views</span>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-4">
        <h2 className="text-lg font-semibold mb-3">What they care about:</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div className="bg-gray-100 p-3 rounded-lg">
            <div className="font-medium text-dark">Trump</div>
            <div>{remix.trumpCaresAbout}</div>
          </div>
          <div className="bg-gray-100 p-3 rounded-lg">
            <div className="font-medium text-dark">Zelensky</div>
            <div>{remix.zelenskyCaresAbout}</div>
          </div>
          <div className="bg-gray-100 p-3 rounded-lg">
            <div className="font-medium text-dark">JD Vance</div>
            <div>{remix.vanceCaresAbout}</div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <Link href="/">
          <button className="w-full py-3 bg-secondary text-white font-bold rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
              />
            </svg>
            Make Your Own Version
          </button>
        </Link>
      </div>
    </div>
  );
};

export default RemixDetails;
