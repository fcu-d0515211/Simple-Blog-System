import {
  FunctionComponent,
  useState,
  createRef,
  RefObject,
  KeyboardEventHandler,
} from "react";
import { getPosts, PostsFilter, deletePost } from "~src/request/post";
import PostModel from "~src/model/post.model";
import PostCard from "~components/post-card";
import styles from "~styles/pages/post/index.module.scss";
import Layout from "~components/layout";
import { getNotEmptyFilter } from "~lib/query-helper";
import InputField from "~components/input-field";
import { isBrowser } from "~lib/is-browser";
import Button from "~components/button";
import { getLocalUser, getToken } from "~lib/auth";
import UserModel from "~src/model/user.model";
import { useRouter } from "next/dist/client/router";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import withAuth from "~components/withAuth";

interface PostMeProps {
  customRefs?: {
    title: RefObject<HTMLInputElement>;
    likeGte: RefObject<HTMLInputElement>;
    keywords: RefObject<HTMLInputElement>;
  };
}

/**
 * Declare swal alert2
 */
const MySwal = withReactContent(Swal);

/**
 * My Post Page
 * @param param
 */
const PostMe: FunctionComponent<PostMeProps> = ({
  customRefs,
}: PostMeProps) => {
  if (!customRefs) {
    throw new Error("Refs must be empty");
  }

  //
  const me = getLocalUser() as UserModel;

  // declare router
  const router = useRouter();

  /**
   * declare page variable
   */
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

  /**
   * Declare State for filtering, pagination
   */
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
      keywords: "",
      user_id: me.id,
    },
    posts: [] as PostModel[],
  });

  // declare temporary postfilter
  let postsFilter: PostsFilter = pageOptions.filters;

  /**
   * Search Post Function
   * @param page
   */
  const searchPost = (page: number) => {
    if (
      customRefs?.title.current &&
      customRefs?.likeGte.current &&
      customRefs?.keywords.current
    ) {
      postsFilter = {
        title: customRefs.title.current.value,
        likeGte: +customRefs.likeGte.current.value,
        keywords: customRefs.keywords.current.value,
        user_id: me.id,
      };
    }

    if (
      pageOptions.filters.title === postsFilter.title &&
      pageOptions.filters.likeGte === postsFilter.likeGte &&
      pageOptions.filters.keywords === postsFilter.keywords &&
      pageOptions.filters.page === page
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
        keywords: postsFilter.keywords,
        user_id: me.id,
      },
      posts: res.posts,
    });
  };

  // Key Enter Handler
  const onKeyEnter: KeyboardEventHandler = (e) => {
    if (e.key === "Enter") {
      searchPost(1);
    }
  };

  /**
   * On Button Click Handler
   * @param eventName
   * @param post
   */
  const onButtonClickHandler = (eventName: string, post: PostModel) => {
    switch (eventName) {
      case "info":
        router.push(`/posts/${post.id}`);
        break;

      case "delete":
        MySwal.fire({
          title: "Are you sure you wan to delete this post?",
          showConfirmButton: true,
          showCancelButton: true,
          confirmButtonText: "Cancel",
          cancelButtonText: "Delete",
          confirmButtonColor: "#007bff",
          cancelButtonColor: "#dc3545",
        }).then(async (status) => {
          if (!status.isConfirmed) {
            const req = await deletePost(post.id, getToken() as string);
            if (req.status) {
              toastr.success("Post Deleted.");
            } else {
              toastr.error("Fail to delete post.");
            }
          }
        });
        break;

      case "edit":
        router.push(`/posts/${post.id}/edit`);
        break;

      default:
        break;
    }
  };

  if (isBrowser) {
    // Get not empty queries
    const filter = getNotEmptyFilter(pageOptions.filters);

    // fetch post
    const { data, error } = getPosts(filter);

    // check the response is valid.
    if (data && data.posts && data.posts.data) {
      if (pageOptions.totalData !== +data.posts.total) {
        res = {
          total: data.posts.total,
          page: data.posts.page,
          totalPage: data.posts.totalPage,
          posts: [...pageOptions.posts, ...data.posts.data],
        };

        toastr.success("Fetch Post Successul");
      }
    } else if (error) {
      toastr.error("Fetch Data Failed");
    }
  }

  return (
    <Layout titleName="My Posts">
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
          onKeyDown={onKeyEnter}
        />
        <InputField
          style={{ width: "200px" }}
          inputStyle={{ width: "40px" }}
          placeholder="Input Number"
          labelText="Like >="
          name="likeGte"
          type="number"
          inputRef={customRefs.likeGte}
          min={0}
          onKeyDown={onKeyEnter}
        />
        <InputField
          style={{ width: "300px" }}
          inputStyle={{ width: "40px" }}
          placeholder="Input Keyword"
          labelText="Keyword"
          name="keywords"
          type="text"
          inputRef={customRefs.keywords}
          onKeyDown={onKeyEnter}
        />

        <Button
          text="Search"
          onClick={() => {
            res.posts = [];
            searchPost(1);
          }}
        />
      </div>

      <div className={styles.postList}>
        {res.posts.map((post, idx) => (
          <PostCard
            post={post}
            // eslint-disable-next-line react/no-array-index-key
            key={`post-card-${idx}`}
            editable={me.id === post.user_id}
            clickHandler={onButtonClickHandler}
          />
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

PostMe.defaultProps = {
  customRefs: {
    title: createRef<HTMLInputElement>(),
    likeGte: createRef<HTMLInputElement>(),
    keywords: createRef<HTMLInputElement>(),
  },
};

export default withAuth(PostMe);
