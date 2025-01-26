const MessageBoxLoading = () => {
  return (
    <div className="flex flex-col w-full lg:w-9/12 bg-light-secondary dark:bg-dark-primary rounded-lg py-3 px-3">
      <div className="animate-pulse-expand space-y-2 w-full">
        <div className="h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full w-full" />
        <div className="h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full w-full" />
        <div className="h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full w-4/5" />
        <div className="h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full w-1/5" />
      </div>
    </div>
  );
};

export default MessageBoxLoading;
