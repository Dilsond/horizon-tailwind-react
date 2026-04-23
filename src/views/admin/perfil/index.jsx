import Banner from "./components/Banner";
import General from "./components/General";
import Project from "./components/Project";

const ProfileOverview = () => {
  return (
    <div className="flex w-full flex-col gap-5">
      <div className="w-ful mt-3 flex h-fit flex-col gap-5 lg:grid lg:grid-cols-1">
        <div className="col-span-6 lg:!mb-0">
          <Banner />
        </div>
      </div>
      <div className="grid h-full grid-cols-1 gap-5 lg:!grid-cols-1">
        <div className="col-span-5 lg:col-span-6 lg:mb-0 3xl:col-span-4">
          <Project />
        </div>
        <div className="col-span-5 lg:col-span-6 lg:mb-0 3xl:col-span-5">
          <General />
        </div>
      </div>
    </div>
  );
};

export default ProfileOverview;
