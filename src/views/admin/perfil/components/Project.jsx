import React from "react";
import { MdModeEditOutline } from "react-icons/md";
import image1 from "assets/img/profile/image1.png";
import image2 from "assets/img/profile/image2.png";
import image3 from "assets/img/profile/image3.png";
import Card from "components/card";

const Project = () => {
  return (
    <Card extra={"w-full p-4 h-full"}>
      <div className="mb-2 w-full ml-3">
        <h4 className="text-xl font-bold text-navy-700 dark:text-white">
          Produtos Divulgados
        </h4>

      </div>

      {/* Project 1 */}
      <div className="flex w-full items-center justify-between rounded-2xl bg-white p-3 shadow-3xl shadow-shadow-500 dark:!bg-navy-700 dark:shadow-none">
        <div className="flex items-center">
          <div className="">
            <img className="h-[83px] w-[83px] rounded-lg" src={image1} alt="" />
          </div>
          <div className="ml-4">
            <p className="text-base font-medium text-navy-700 dark:text-white">
              Technology behind the Blockchain
            </p>
            <p className="mt-2 text-sm text-gray-600">
              weitrcyvgulbhçkj rsxdgj fhb
            </p>
            <p className="mt-2 text-sm text-gray-600">
              254,447kzs
            </p>
          </div>
        </div>
      </div>

      {/* Project 1 */}
      <div className="mt-3 flex w-full items-center justify-between rounded-2xl bg-white p-3 shadow-3xl shadow-shadow-500 dark:!bg-navy-700 dark:shadow-none">
        <div className="flex items-center">
          <div className="">
            <img className="h-[83px] w-[83px] rounded-lg" src={image3} alt="" />
          </div>
          <div className="ml-4">
            <p className="text-base font-medium text-navy-700 dark:text-white">
              Technology behind the Blockchain
            </p>
            <p className="mt-2 text-sm text-gray-600">
              weitrcyvgulbhçkj rsxdgj fhb
            </p>
            <p className="mt-2 text-sm text-gray-600">
              254,447kzs
            </p>
          </div>
        </div>
      </div>
      
      {/* Project 1 */}
      <div className="mt-3 mb-3 flex w-full items-center justify-between rounded-2xl bg-white p-3 shadow-3xl shadow-shadow-500 dark:!bg-navy-700 dark:shadow-none">
        <div className="flex items-center">
          <div className="">
            <img className="h-[83px] w-[83px] rounded-lg" src={image2} alt="" />
          </div>
          <div className="ml-4">
            <p className="text-base font-medium text-navy-700 dark:text-white">
              Technology behind the Blockchain
            </p>
            <p className="mt-2 text-sm text-gray-600">
              weitrcyvgulbhçkj rsxdgj fhb
            </p>
            <p className="mt-2 text-sm text-gray-600">
              254,447kzs
            </p>
          </div>
        </div>
      </div>

      <div className="flex w-full items-center justify-between rounded-2xl bg-white p-3 shadow-3xl shadow-shadow-500 dark:!bg-navy-700 dark:shadow-none">
        <div className="flex items-center">
          <div className="">
            <img className="h-[83px] w-[83px] rounded-lg" src={image1} alt="" />
          </div>
          <div className="ml-4">
            <p className="text-base font-medium text-navy-700 dark:text-white">
              Technology behind the Blockchain
            </p>
            <p className="mt-2 text-sm text-gray-600">
              weitrcyvgulbhçkj rsxdgj fhb
            </p>
            <p className="mt-2 text-sm text-gray-600">
              254,447kzs
            </p>
          </div>
        </div>
      </div>

      {/* Project 1 */}
      <div className="mt-3 flex w-full items-center justify-between rounded-2xl bg-white p-3 shadow-3xl shadow-shadow-500 dark:!bg-navy-700 dark:shadow-none">
        <div className="flex items-center">
          <div className="">
            <img className="h-[83px] w-[83px] rounded-lg" src={image3} alt="" />
          </div>
          <div className="ml-4">
            <p className="text-base font-medium text-navy-700 dark:text-white">
              Technology behind the Blockchain
            </p>
            <p className="mt-2 text-sm text-gray-600">
              weitrcyvgulbhçkj rsxdgj fhb
            </p>
            <p className="mt-2 text-sm text-gray-600">
              254,447kzs
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default Project;
