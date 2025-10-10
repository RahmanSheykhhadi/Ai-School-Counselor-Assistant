import React from 'react';

// Common props for icons
type IconProps = React.SVGProps<SVGSVGElement>;

const geminiLogoBase64 = "data:image/png;base64,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";

export const GeminiLogoIcon: React.FC<React.ImgHTMLAttributes<HTMLImageElement>> = (props) => (
    <img src={geminiLogoBase64} alt="Gemini Logo" {...props} />
);

export const AppLogoIcon: React.FC<React.ImgHTMLAttributes<HTMLImageElement>> = (props) => {
    return <GeminiLogoIcon {...props} />;
};

export const HomeIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h7.5" />
  </svg>
);

export const ClassroomIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-4.684v.005zM4.501 15.128a9.38 9.38 0 0 1 2.625.372 9.337 9.337 0 0 1 4.121-.952 4.125 4.125 0 0 1-7.533-2.493m0 2.493v-.003c0 1.113.285 2.16.786 3.07m0-3.07v.106A12.318 12.318 0 0 0 8.624 21c2.331 0 4.512-.645 6.374-1.766l.001-.109a6.375 6.375 0 0 0-11.964-4.684v.005z" />
    </svg>
);

export const UsersIcon: React.FC<IconProps> = ClassroomIcon;

export const UserIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
);

export const CalendarIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0h18M12 12.75h.008v.008H12v-.008z" />
  </svg>
);

export const ChartBarIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125z" />
  </svg>
);

export const CogIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-1.008 1.11-1.226.55-.218 1.19-.218 1.74 0 .55.218 1.02.684 1.11 1.226l.094.559a8.25 8.25 0 0 1 3.42 1.42l.462-.33a1.875 1.875 0 0 1 2.37.838l1.437 2.492a1.875 1.875 0 0 1-.433 2.56l-.42.302a8.25 8.25 0 0 1 0 3.398l.42.302a1.875 1.875 0 0 1 .433 2.56l-1.437 2.492a1.875 1.875 0 0 1-2.37-.838l-.462-.33a8.25 8.25 0 0 1-3.42 1.42l-.094.559c-.09.542-.56 1.008-1.11 1.226-.55-.218-1.19-.218-1.74 0-.55-.218-1.02-.684-1.11-1.226l-.094-.559a8.25 8.25 0 0 1-3.42-1.42l-.462.33a1.875 1.875 0 0 1-2.37-.838l-1.437-2.492a1.875 1.875 0 0 1 .433-2.56l.42-.302a8.25 8.25 0 0 1 0-3.398l-.42-.302a1.875 1.875 0 0 1-.433-2.56l1.437-2.492a1.875 1.875 0 0 1 2.37.838l.462.33a8.25 8.25 0 0 1 3.42-1.42l.094-.559z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
  </svg>
);

export const Squares2X2Icon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 8.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25v2.25A2.25 2.25 0 0 1 8.25 20.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25v2.25A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
  </svg>
);

export const LockClosedIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 00-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
  </svg>
);

export const LockOpenIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 00-9 0v3.75m.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
  </svg>
);

export const PlusIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

export const EditIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 19.82a2.25 2.25 0 0 1-1.06.607l-4.5 1.5a.75.75 0 0 1-.95-.95l1.5-4.5a2.25 2.25 0 0 1 .607-1.06L16.862 4.487Zm0 0L19.5 7.125" />
  </svg>
);

export const TrashIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.036-2.134H8.716C7.59 2.75 6.68 3.704 6.68 4.884v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
  </svg>
);

export const SparklesIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.898 20.553 15 22.5l-1.898-1.947a3.375 3.375 0 0 0-4.773-4.773L6.38 14.25l1.947-1.898a3.375 3.375 0 0 0 4.773 4.773Z" />
  </svg>
);

export const FolderIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
  </svg>
);

export const UploadIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
  </svg>
);

export const Bars2Icon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
  </svg>
);

export const CalculatorIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008Zm0 2.25h.008v.008H8.25V13.5Zm0 2.25h.008v.008H8.25v-.008Zm0 2.25h.008v.008H8.25V18Zm2.498-6.75h.007v.008h-.007v-.008Zm0 2.25h.007v.008h-.007V13.5Zm0 2.25h.007v.008h-.007v-.008Zm0 2.25h.007v.008h-.007V18Zm2.504-6.75h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V13.5Zm0 2.25h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V18Zm2.498-6.75h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V13.5ZM8.25 6h7.5v2.25h-7.5V6ZM12 2.25c-1.892 0-3.758.11-5.593.322C5.307 2.7 4.5 3.65 4.5 4.757V19.5a2.25 2.25 0 0 0 2.25 2.25h10.5a2.25 2.25 0 0 0 2.25-2.25V4.757c0-1.108-.806-2.057-1.907-2.185A48.223 48.223 0 0 0 12 2.25Z" />
  </svg>
);

export const StarIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
  </svg>
);

export const ClipboardDocumentListIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75c0-.231-.035-.454-.1-.664M6.75 7.5h4.5a.75.75 0 0 0 .75-.75c0-.231-.035-.454-.1-.664m-5.801 0c.065.21.1.433.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75c0-.231-.035-.454-.1-.664M6.75 7.5h-1.5a.75.75 0 0 0-.75.75V18a2.25 2.25 0 0 0 2.25 2.25h13.5A2.25 2.25 0 0 0 21 18V7.5a2.25 2.25 0 0 0-2.25-2.25H15M12 15h3.75" />
  </svg>
);

export const QuestionMarkCircleIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
  </svg>
);

export const SearchIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
  </svg>
);

export const PrintIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0c1.091 0 2.182-.53 2.182-1.371a3.484 3.484 0 0 0-3.484-3.484H6.34c-1.928 0-3.484 1.556-3.484 3.484 0 .841 1.091 1.371 2.182 1.371m9.328 0h-2.182m2.182 0H6.34m11.318 0c.045.523-.082 1.06-.34 1.5H6.68a1.86 1.86 0 0 1-.34-1.5m9.328 0a1.86 1.86 0 0 0-.34-1.5H6.68a1.86 1.86 0 0 0-.34 1.5M4.5 12V6a2.25 2.25 0 0 1 2.25-2.25h10.5A2.25 2.25 0 0 1 19.5 6v6m-15 0h15" />
  </svg>
);

export const ChevronDownIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
  </svg>
);
