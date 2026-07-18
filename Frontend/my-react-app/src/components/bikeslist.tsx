import { useQuery } from "@tanstack/react-query";

export default function BikesList() {
  const { isPending, error, data } = useQuery({
    queryKey: ["repoData"],
    queryFn: () =>
      fetch("http://localhost:9080/booking/available-bikes", {
        method: "POST",
        body: JSON.stringify({}),
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }).then((res) => res.json()),
  });
  if (isPending) return "Loading...";

  if (error) return "An error has occurred: " + error.message;
  const availableBikes = data.availableBikes;
  return (
    <ul className=" flex flex-col gap-1 p-1">
      {availableBikes.map((availableBike) => (
        <AvailableBikeItem availableBike={availableBike} />
      ))}
    </ul>
  );
}

3;
export function AvailableBikeItem(props: { availableBike: AvailableBike }) {
  const item = props.availableBike;

  return (
    <>
      <li className="grid grid-cols-2 hover:border-2 p-1 border-black">
        <div className="flex flex-row gap-1">
          <span>модель:</span>
          <span>{item.model}</span>
        </div>
        <div className=" flex flex-row gap-1">
          <span>доступность:</span>
          <span>{item.availability}</span>
        </div>
        <div className=" flex flex-row gap-1 ">
          <span>год:</span>
          <span>{item.year}</span>
        </div>
        <div className=" flex flex-row gap-1">
          <span>категория:</span>
          <span>{item.category}</span>
        </div>
        <span>мощность:{item.power}</span>
      </li>
    </>
  );
}

type AvailableBike = {
  model: string;
  year: number;
  availability: boolean;
  category: string;
  power: number;
};
