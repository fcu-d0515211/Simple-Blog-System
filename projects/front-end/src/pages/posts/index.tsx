import {
  FunctionComponent,
  useState,
  createRef,
  RefObject,
} from "react";
import { getPosts, PostsFilter } from "~src/request/post";
import PostModel from "~src/model/post.model";
import PostCard from "~components/post-card";
import styles from "~styles/pages/post/index.module.scss";
import Layout from "~components/layout";
import { getNotEmptyFilter } from "~lib/query-helper";
import InputField from "~components/input-field";
import { isBrowser } from "~lib/is-browser";
import Button from "~components/button";
import { getLocalUser } from "~lib/auth";
import UserModel from "~src/model/user.model";
import { useRouter } from "next/dist/client/router";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

interface PostIndexProps {
  customRefs?: {
    title: RefObject<HTMLInputElement>;
    likeGte: RefObject<HTMLInputElement>;
  };
}

const MySwal = withReactContent(Swal);

const PostIndex: FunctionComponent<PostIndexProps> = ({
  customRefs,
}: PostIndexProps) => {
  const me: UserModel = getLocalUser();

  const router = useRouter();
  let res: {
    total: number;
    page: number;
    totalPage: number;
    posts: PostModel[];
  } = {
    total: 0,
    page: 1,
    totalPage: 1,
    posts: [],
  };

  const [pageOptions, setPageOptions] = useState<{
    totalData: number;
    filters: PostsFilter;
    posts: PostModel[];
  }>({
    totalData: 0,
    filters: {
      page: 1,
      title: "",
      likeGte: 0,
    },
    posts: [] as PostModel[],
  });

  let postsFilter: PostsFilter = pageOptions.filters;

  /**
   * Search Post Function
   * @param page
   */
  const searchPost = (page: number) => {
    if (customRefs?.title.current && customRefs?.likeGte.current) {
      postsFilter = {
        title: customRefs.title.current.value,
        likeGte: +customRefs.likeGte.current.value,
      };
    }

    if (
      pageOptions.filters.title === postsFilter.title &&
      pageOptions.filters.likeGte === postsFilter.likeGte
    ) {
      return;
    }

    // Update State
    setPageOptions({
      ...pageOptions,
      filters: {
        page,
        title: postsFilter.title,
        likeGte: postsFilter.likeGte,
      },
    });
  };

  if (isBrowser) {
    // Get not empty queries
    const filter = getNotEmptyFilter(pageOptions.filters);

    // fetch post
    const { data, error } = getPosts(filter);

    // check the response is valid.
    if (data && data.posts && data.posts.data) {
      if (pageOptions.totalData != +data.posts.total) {
        res = {
          total: data.posts.total,
          page: data.posts.page,
          totalPage: data.posts.totalPage,
          posts: data.posts.data,
        };

        toastr.success("Fetch Post Successul");
      }
    } else if (error) {
      toastr.error("Fetch Data Failed");
    }
  }

  return (
    <Layout
      titleName="Home Page"
    >
      {/* Search */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          marginBottom: "30px",
          padding: "10px",
        }}
      >
        <InputField
          style={{ width: "200px" }}
          labelText="Title"
          name="title"
          inputRef={customRefs.title}
        />
        <InputField
          style={{ width: "300px" }}
          inputStyle={{ width: "40px" }}
          placeholder="Input Number"
          labelText="Like (Greater Than)"
          name="likeGte"
          type="number"
          inputRef={customRefs.likeGte}
          min={0}
        />

        <Button text="Search" onClick={() => searchPost(1)} />
      </div>

      <div className={styles.postList}>
        {res.posts.map((post, idx) => (
          <PostCard 
          href={`/posts/${post.id}`}
          post={post} 
          key={`post-card-${idx}`} />
        ))}

        {res.total === res.posts.length ? (
          <p> No More Data</p>
        ) : (
          <button type="button" onClick={() => searchPost(res.page + 1)}>
            Load More
          </button>
        )}
      </div>
    </Layout>
  );
};

PostIndex.defaultProps = {
  customRefs: {
    title: createRef<HTMLInputElement>(),
    likeGte: createRef<HTMLInputElement>(),
  },
};

export default PostIndex;