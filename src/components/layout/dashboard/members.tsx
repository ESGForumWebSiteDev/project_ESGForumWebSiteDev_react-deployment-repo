import { Card, CardBody, CardHeader, Typography } from "@material-tailwind/react"
import TableHead from "../table/tableHead"
import { Member } from "../../../types/admin.interface";
import { useEffect, useState } from "react";
import Spinner from "./spinner";
import authenticatedAxios from "../../../services/request.service";
import PlusCircleIcon from "@heroicons/react/24/solid/PlusCircleIcon";
import AddMemberModal from "../../widget/cards/addMemberModal";
import { getAutortity, selectMember } from "../../../services/member.service";
import axios from "axios";

interface MembersProps {
  setMemberCount: React.Dispatch<React.SetStateAction<number>>;
}

const Members: React.FC<MembersProps> = ({
  setMemberCount }) => {
  const [ready, setReady] = useState<boolean>(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selected, setSelected] = useState<number[]>([]);
  const myAxios = authenticatedAxios();

  const handleSubmit = async (name: string, affiliation: string) => {

    try {
      const response = await myAxios.post("members", {
        name,
        affiliation,
      });

      if (response.status === 201) {
        const newMember = response.data;
        window.alert("추가 성공");
        console.log(newMember)
        setMembers([...members, newMember]);
        setMemberCount(members.length);
        setShowModal(false);
      }
    }
    catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        window.alert("이미 포럼의 회원입니다.");
        return;
      }
      window.alert("오류가 발생했습니다. 다시 시도하세요.");
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await myAxios.get<Member[]>("/members");

        if (response.status === 200) {
          const memberData = response.data;

          setMembers(memberData);
          setMemberCount(memberData.length);
        }
      } catch (error) {
        window.alert("데이터를 불러올 수 없습니다.")
      }
      setReady(true);
    };

    fetchData();
  }, []);
  const tdTextContent = "font-medium text-blue-gray-600 text-center";

  const getNewMembers = (members: Member[], ids: number[]) => {
    const newMember = members.filter((member) => !(ids.includes(member.id)));
    return newMember;
  }

  // 직위 변경
  const positionChange = async (ids: number[], setMembers: React.Dispatch<React.SetStateAction<Member[]>>) => {

    if (!(ids?.length === 1)) {
      window.alert("회원 한 명을 선택하세요.");
      return;
    }

    const id = ids[0];
    const note = window.prompt("새로운 직위를 입력하세요.");

    if (note === null) {
      return;
    }

    if (!note) {
      window.alert("직위를 입력하세요.");
      return;
    }

    try {
      const response = await myAxios.put("/members", {
        id,
        note
      });

      if (response.status === 201) {
        const newMembersInfo: Member[] = response.data;
        setMembers(newMembersInfo);
        setSelected([]);
        window.alert("수정 완료");
        return;
      }
      
      window.alert("문제가 발생했습니다. 다시 시도하세요.");
      
    } catch (error) {
      window.alert("문제가 발생했습니다. 다시 시도하세요.");
    }
    setSelected([]);
  }

  // 회원 삭제
  const deleteMember = async (
    ids: number[],
    members: Member[],
    setMembers: React.Dispatch<React.SetStateAction<Member[]>>) => {
    if (!(ids?.length)) {
      window.alert("회원을 선택하세요.");
      return;
    }

    try {
      const flag = window.confirm("회원을 탈퇴시키겠습니까?");

      if (!flag) return;

      const response = await myAxios.delete("/members", {
        data: { ids }
      });

      if (response.status === 204) {
        const newMembers = getNewMembers(members, ids);
        setMembers(newMembers);
        setMemberCount(newMembers.length);
        window.alert("탈퇴 완료");
        setSelected([]);
        return;
      }

      window.alert("문제가 발생했습니다. 다시 시도하세요.");

    } catch (error) {
      window.alert("문제가 발생했습니다. 다시 시도하세요.");
    }
  }

  return (
    <div
      className="relative"
    >
      <Spinner flag={ready} />
      <div className={`${ready ? "" : "opacity-0"} transition-opacity`}>
        <Card
          className="border-2 border-slate-100 rounded-lg">
          <CardHeader
            floated={false}
            shadow={false}
            color="transparent"
            className="m-0 flex items-center justify-between p-6"
          >
            <Typography variant="h6" color="blue-gray" className="mb-1">
              포럼 회원 정보
            </Typography>
            <div className="absolute mb-1 right-6 flex items-center">
              <div className={`space-x-5 ${selected?.length ? "" : "opacity-0"} transition-opacity`}>
                <button
                  className={`${(selected?.length === 1) ? "" : "opacity-0"} transition-opacity
                   w-15 bg-admin text-white font-bold text-sm px-1 py-1 rounded shadow hover:shadow-lg`}
                  onClick={async () => positionChange(selected, setMembers)}
                >
                  직위 변경
                </button>
                <button
                  className={"w-15 bg-red-500 text-white font-bold text-sm px-1 py-1 rounded shadow hover:shadow-lg my-1"}
                  onClick={async () => deleteMember(selected, members, setMembers)}
                >
                  포럼 탈퇴
                </button>
              </div>
              <PlusCircleIcon
                className="font-medium w-10 cursor-pointer ml-5 text-admin"
                type="button"
                onClick={() => setShowModal(true)}
              />
            </div>
          </CardHeader>
          <CardBody className="max-h-[400px] overflow-y-scroll px-0 pt-0 pb-2">
            <table className="w-full min-w-[840px] table-auto">
              <TableHead topics={["", "이름", "이메일", "소속", "사이트 가입 여부", "포럼 직위"]} px="px-1" />
              <tbody>
                {members.map(
                  ({ id, email, name, affiliation, authority, note }, key) => {
                    const className = `py-3 px-1 ${key === members.length - 1
                      ? ""
                      : "border-b border-blue-gray-50"
                      }`;

                    return (
                      <tr
                        key={id}
                        className={`transition-shadow hover:shadow-inner ${selected.includes(id)
                          ? "bg-gray-50"
                          : ""}`}
                        onClick={() => selectMember(id, selected, setSelected)}
                      >
                        <td className={`${className} flex justify-center`}>
                          <div className="h-full">
                            <input
                              type="checkbox"
                              value={id}
                              checked={selected.includes(id)}
                              className="rounded"
                              onChange={() => selectMember(id, selected, setSelected)}
                            />
                          </div>
                        </td>
                        <td className={className}>
                          <Typography
                            variant="small"
                            className={tdTextContent}
                          >
                            {name}
                          </Typography>
                        </td>
                        <td className={className}>
                          <Typography
                            variant="small"
                            className={tdTextContent}
                          >
                            {email ? email : "-"}
                          </Typography>
                        </td>
                        <td className={className}>
                          <Typography
                            variant="small"
                            className={tdTextContent}
                          >
                            {affiliation}
                          </Typography>
                        </td>
                        <td className={className}>
                          <Typography
                            variant="small"
                            className={tdTextContent}
                          >
                            {getAutortity(authority)}
                          </Typography>
                        </td>
                        <td className={`${className}`}>
                          <Typography
                            variant="small"
                            className={tdTextContent}
                          >
                            {note || "일반 회원"}
                          </Typography>
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </CardBody>
        </Card>
      </div>
      <AddMemberModal
        title="포럼 회원 추가"
        showModal={showModal}
        setShowModal={setShowModal}
        handleSubmit={handleSubmit}
      />
    </div>
  )
}

export default Members;